import { and, eq } from 'drizzle-orm';
import { withTransaction } from '$lib/server/db/client';
import {
  followUps,
  incidentAssets,
  incidentEscalationRuntime,
  incidents,
  incidentSummaries
} from '$lib/server/db/schema';
import type {
  AddEventInput,
  AssignLeadInput,
  ChangeSeverityInput,
  CloseIncidentInput,
  DeclareIncidentInput,
  IncidentService,
  ResolveIncidentInput,
  UpdateStatusInput
} from '$lib/server/domain/contracts';
import { assertValidStatusTransition } from '$lib/server/domain/state-machine';
import type { DeclaredIncident, IncidentEvent } from '$lib/shared/domain';
import { appendIncidentEvent, insertInitialIncidentEvent, lockIncidentCurrentState } from './event-store';

function deriveActorType(input: {
  actorMemberId: string | null | undefined;
  actorExternalId: string | null | undefined;
}): IncidentEvent['actorType'] {
  if (input.actorMemberId) {
    return 'member';
  }

  if (input.actorExternalId) {
    return 'integration';
  }

  return 'system';
}

function buildIncidentEvent(
  params: Omit<IncidentEvent, 'eventVersion' | 'schemaVersion'>
): IncidentEvent {
  return {
    ...params,
    eventVersion: 1,
    schemaVersion: 1
  };
}

async function updateStatusInTx(
  input: UpdateStatusInput,
  actor: { actorMemberId: string | null | undefined; actorExternalId: string | null | undefined }
): Promise<void> {
  await withTransaction(async (tx) => {
    const current = await lockIncidentCurrentState(tx, input.organizationId, input.incidentId);
    assertValidStatusTransition(current.status, input.newStatus);

    await appendIncidentEvent(
      tx,
      buildIncidentEvent({
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        eventType: 'status_change',
        actorType: deriveActorType(actor),
        actorMemberId: actor.actorMemberId ?? null,
        actorExternalId: actor.actorExternalId ?? null,
        payload: {
          from: current.status,
          to: input.newStatus
        }
      }),
      {
        status: input.newStatus
      }
    );
  });
}

export class IncidentServiceImpl implements IncidentService {
  async declareIncident(input: DeclareIncidentInput): Promise<DeclaredIncident> {
    return withTransaction(async (tx) => {
      const [incident] = await tx
        .insert(incidents)
        .values({
          organizationId: input.organizationId,
          title: input.title,
          declaredByMemberId: input.declaredByMemberId ?? null,
          facilityId: input.facilityId,
          areaId: input.areaId ?? null,
          assignedToMemberId: input.assignedToMemberId ?? null,
          chatPlatform: input.chatPlatform,
          chatChannelRef: input.chatChannelRef,
          tags: input.tags ?? []
        })
        .returning();

      if (!incident) {
        throw new Error('Failed to create incident');
      }

      if (input.assetIds && input.assetIds.length > 0) {
        await tx.insert(incidentAssets).values(
          input.assetIds.map((assetId) => ({
            incidentId: incident.id,
            assetId,
            organizationId: input.organizationId
          }))
        );
      }

      await insertInitialIncidentEvent(
        tx,
        buildIncidentEvent({
          organizationId: input.organizationId,
          incidentId: incident.id,
          eventType: 'declared',
          actorType: deriveActorType({
            actorMemberId: input.declaredByMemberId ?? null,
            actorExternalId: input.actorExternalId ?? null
          }),
          actorMemberId: input.declaredByMemberId ?? null,
          actorExternalId: input.actorExternalId ?? null,
          sourcePlatform: input.chatPlatform,
          payload: {
            title: input.title,
            severity: input.severity,
            facilityId: input.facilityId,
            areaId: input.areaId ?? null,
            assetIds: input.assetIds ?? []
          },
          rawSourcePayload: input.rawSourcePayload ?? null
        }),
        {
          status: 'DECLARED',
          severity: input.severity,
          assignedToMemberId: input.assignedToMemberId ?? null
        }
      );

      await tx
        .insert(incidentEscalationRuntime)
        .values({
          incidentId: incident.id,
          organizationId: input.organizationId,
          policyId: null,
          latestStepOrder: 0
        })
        .onConflictDoNothing({ target: incidentEscalationRuntime.incidentId });

      return {
        id: incident.id,
        organizationId: input.organizationId,
        title: incident.title,
        status: 'DECLARED',
        severity: input.severity,
        declaredByMemberId: input.declaredByMemberId ?? null,
        declaredAt: incident.declaredAt,
        facilityId: incident.facilityId,
        areaId: incident.areaId,
        assignedToMemberId: incident.assignedToMemberId,
        chatPlatform: incident.chatPlatform,
        chatChannelRef: incident.chatChannelRef,
        tags: incident.tags
      };
    });
  }

  async updateStatus(input: UpdateStatusInput): Promise<void> {
    await updateStatusInTx(input, {
      actorMemberId: input.actorMemberId ?? null,
      actorExternalId: input.actorExternalId ?? null
    });
  }

  async changeSeverity(input: ChangeSeverityInput): Promise<void> {
    await withTransaction(async (tx) => {
      const current = await lockIncidentCurrentState(tx, input.organizationId, input.incidentId);

      await appendIncidentEvent(
        tx,
        buildIncidentEvent({
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          eventType: 'severity_change',
          actorType: deriveActorType({
            actorMemberId: input.actorMemberId ?? null,
            actorExternalId: null
          }),
          actorMemberId: input.actorMemberId ?? null,
          payload: {
            from: current.severity,
            to: input.severity
          }
        }),
        {
          severity: input.severity
        }
      );
    });
  }

  async assignLead(input: AssignLeadInput): Promise<void> {
    await withTransaction(async (tx) => {
      await appendIncidentEvent(
        tx,
        buildIncidentEvent({
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          eventType: 'assignment',
          actorType: deriveActorType({
            actorMemberId: input.actorMemberId ?? null,
            actorExternalId: null
          }),
          actorMemberId: input.actorMemberId ?? null,
          payload: {
            assignedToMemberId: input.memberId
          }
        }),
        {
          assignedToMemberId: input.memberId
        }
      );

      await tx
        .update(incidents)
        .set({ assignedToMemberId: input.memberId })
        .where(
          and(eq(incidents.organizationId, input.organizationId), eq(incidents.id, input.incidentId))
        );
    });
  }

  async addEvent(input: AddEventInput): Promise<void> {
    await withTransaction(async (tx) => {
      await appendIncidentEvent(tx, input.event);
    });
  }

  async resolveIncident(input: ResolveIncidentInput): Promise<void> {
    await updateStatusInTx(
      {
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        newStatus: 'RESOLVED'
      },
      {
        actorMemberId: input.actorMemberId ?? null,
        actorExternalId: null
      }
    );

    await withTransaction(async (tx) => {
      await tx
        .insert(incidentSummaries)
        .values({
          incidentId: input.incidentId,
          organizationId: input.organizationId,
          whatHappened: input.summary.whatHappened,
          rootCause: input.summary.rootCause,
          resolution: input.summary.resolution,
          impact: input.summary.impact,
          aiSummary: input.summary.aiSummary ?? null
        })
        .onConflictDoUpdate({
          target: incidentSummaries.incidentId,
          set: {
            whatHappened: input.summary.whatHappened,
            rootCause: input.summary.rootCause,
            resolution: input.summary.resolution,
            impact: input.summary.impact,
            aiSummary: input.summary.aiSummary ?? null,
            updatedAt: new Date().toISOString()
          }
        });

      await appendIncidentEvent(
        tx,
        buildIncidentEvent({
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          eventType: 'resolved',
          actorType: deriveActorType({
            actorMemberId: input.actorMemberId ?? null,
            actorExternalId: null
          }),
          actorMemberId: input.actorMemberId ?? null,
          payload: {
            summary: input.summary
          }
        })
      );
    });
  }

  async closeIncident(input: CloseIncidentInput): Promise<void> {
    await updateStatusInTx(
      {
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        newStatus: 'CLOSED'
      },
      {
        actorMemberId: input.actorMemberId ?? null,
        actorExternalId: null
      }
    );

    await withTransaction(async (tx) => {
      let createdCount = 0;

      for (const followUp of input.followUps) {
        const [created] = await tx
          .insert(followUps)
          .values({
            organizationId: input.organizationId,
            incidentId: input.incidentId,
            description: followUp.description,
            assignedToMemberId: followUp.assignedToMemberId ?? null,
            dueDate: followUp.dueDate ?? null,
            status: 'OPEN'
          })
          .returning({ id: followUps.id });

        createdCount += 1;

        await appendIncidentEvent(
          tx,
          buildIncidentEvent({
            organizationId: input.organizationId,
            incidentId: input.incidentId,
            eventType: 'follow_up_created',
            actorType: deriveActorType({
              actorMemberId: input.actorMemberId ?? null,
              actorExternalId: null
            }),
            actorMemberId: input.actorMemberId ?? null,
            payload: {
              followUpId: created?.id ?? null,
              description: followUp.description,
              assignedToMemberId: followUp.assignedToMemberId ?? null,
              dueDate: followUp.dueDate ?? null
            }
          })
        );
      }

      await appendIncidentEvent(
        tx,
        buildIncidentEvent({
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          eventType: 'closed',
          actorType: deriveActorType({
            actorMemberId: input.actorMemberId ?? null,
            actorExternalId: null
          }),
          actorMemberId: input.actorMemberId ?? null,
          payload: {
            followUpCount: createdCount
          }
        })
      );
    });
  }
}

export const incidentService: IncidentService = new IncidentServiceImpl();
