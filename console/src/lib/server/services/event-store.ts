import { and, eq, sql } from 'drizzle-orm';
import type { DbTransaction } from '$lib/server/db/client';
import { incidentCurrentState, incidentEvents } from '$lib/server/db/schema';
import type { IncidentEvent, IncidentSeverity, IncidentStatus } from '$lib/shared/domain';
import { NotFoundError } from './errors';

interface CurrentStateRow extends Record<string, unknown> {
  status: IncidentStatus;
  severity: IncidentSeverity;
  assignedToMemberId: string | null;
  lastEventSequence: number;
}

interface ProjectionPatch {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assignedToMemberId?: string | null;
}

export async function lockIncidentCurrentState(
  tx: DbTransaction,
  organizationId: string,
  incidentId: string
): Promise<CurrentStateRow> {
  const result = await tx.execute<CurrentStateRow>(sql`
    SELECT
      status,
      severity,
      assigned_to_member_id AS "assignedToMemberId",
      last_event_sequence AS "lastEventSequence"
    FROM incident_current_state
    WHERE organization_id = ${organizationId} AND incident_id = ${incidentId}
    FOR UPDATE
  `);

  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError(`Incident ${incidentId} not found`);
  }

  return row;
}

export async function appendIncidentEvent(
  tx: DbTransaction,
  event: IncidentEvent,
  patch: ProjectionPatch = {}
): Promise<number> {
  const current = await lockIncidentCurrentState(tx, event.organizationId, event.incidentId);
  const nextSequence = current.lastEventSequence + 1;

  await tx.insert(incidentEvents).values({
    organizationId: event.organizationId,
    incidentId: event.incidentId,
    sequence: nextSequence,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    schemaVersion: event.schemaVersion,
    actorType: event.actorType,
    actorMemberId: event.actorMemberId ?? null,
    actorExternalId: event.actorExternalId ?? null,
    sourcePlatform: event.sourcePlatform ?? null,
    sourceEventId: event.sourceEventId ?? null,
    payload: event.payload,
    rawSourcePayload: event.rawSourcePayload ?? null
  });

  const updateValues: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    assignedToMemberId?: string | null;
    lastEventSequence: number;
    updatedAt: string;
  } = {
    lastEventSequence: nextSequence,
    updatedAt: new Date().toISOString()
  };

  if (patch.status) {
    updateValues.status = patch.status;
  }

  if (patch.severity) {
    updateValues.severity = patch.severity;
  }

  if ('assignedToMemberId' in patch) {
    updateValues.assignedToMemberId = patch.assignedToMemberId ?? null;
  }

  await tx
    .update(incidentCurrentState)
    .set(updateValues)
    .where(
      and(
        eq(incidentCurrentState.organizationId, event.organizationId),
        eq(incidentCurrentState.incidentId, event.incidentId)
      )
    );

  return nextSequence;
}

export async function insertInitialIncidentEvent(
  tx: DbTransaction,
  event: IncidentEvent,
  initial: {
    status: IncidentStatus;
    severity: IncidentSeverity;
    assignedToMemberId?: string | null;
  }
): Promise<void> {
  await tx.insert(incidentEvents).values({
    organizationId: event.organizationId,
    incidentId: event.incidentId,
    sequence: 1,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    schemaVersion: event.schemaVersion,
    actorType: event.actorType,
    actorMemberId: event.actorMemberId ?? null,
    actorExternalId: event.actorExternalId ?? null,
    sourcePlatform: event.sourcePlatform ?? null,
    sourceEventId: event.sourceEventId ?? null,
    payload: event.payload,
    rawSourcePayload: event.rawSourcePayload ?? null
  });

  await tx.insert(incidentCurrentState).values({
    incidentId: event.incidentId,
    organizationId: event.organizationId,
    status: initial.status,
    severity: initial.severity,
    assignedToMemberId: initial.assignedToMemberId ?? null,
    lastEventSequence: 1
  });
}
