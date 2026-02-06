import { and, asc, eq } from 'drizzle-orm';
import { withTransaction, db } from '$lib/server/db/client';
import {
  escalationPolicies,
  escalationPolicySteps,
  incidentEscalationRuntime,
  incidentCurrentState,
  incidents
} from '$lib/server/db/schema';
import { appendIncidentEvent } from './event-store';
import { NotFoundError } from './errors';

export async function acknowledgeIncidentEscalation(input: {
  organizationId: string;
  incidentId: string;
  actorMemberId?: string | null;
}): Promise<void> {
  await withTransaction(async (tx) => {
    const [runtime] = await tx
      .select({ incidentId: incidentEscalationRuntime.incidentId })
      .from(incidentEscalationRuntime)
      .where(
        and(
          eq(incidentEscalationRuntime.organizationId, input.organizationId),
          eq(incidentEscalationRuntime.incidentId, input.incidentId)
        )
      )
      .limit(1);

    if (!runtime) {
      throw new NotFoundError(`Escalation runtime missing for incident ${input.incidentId}`);
    }

    await tx
      .update(incidentEscalationRuntime)
      .set({
        ackedAt: new Date().toISOString(),
        ackedByMemberId: input.actorMemberId ?? null,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(incidentEscalationRuntime.organizationId, input.organizationId),
          eq(incidentEscalationRuntime.incidentId, input.incidentId)
        )
      );

    await appendIncidentEvent(tx, {
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      eventType: 'escalation',
      eventVersion: 1,
      schemaVersion: 1,
      actorType: input.actorMemberId ? 'member' : 'system',
      actorMemberId: input.actorMemberId ?? null,
      payload: {
        action: 'acknowledged'
      }
    });
  });
}

export async function selectEscalationPolicyForIncident(input: {
  organizationId: string;
  incidentId: string;
}): Promise<{ policyId: string; steps: { stepOrder: number; delayMinutes: number; ifUnacked: boolean }[] } | null> {
  const [incident] = await db
    .select({
      facilityId: incidents.facilityId,
      areaId: incidents.areaId,
      severity: incidentCurrentState.severity
    })
    .from(incidents)
    .innerJoin(
      incidentCurrentState,
      and(
        eq(incidentCurrentState.incidentId, incidents.id),
        eq(incidentCurrentState.organizationId, incidents.organizationId)
      )
    )
    .where(and(eq(incidents.organizationId, input.organizationId), eq(incidents.id, input.incidentId)))
    .limit(1);

  if (!incident) {
    throw new NotFoundError(`Incident ${input.incidentId} not found`);
  }

  const policies = await db
    .select({
      id: escalationPolicies.id,
      conditions: escalationPolicies.conditions
    })
    .from(escalationPolicies)
    .where(
      and(
        eq(escalationPolicies.organizationId, input.organizationId),
        eq(escalationPolicies.isActive, true),
        eq(escalationPolicies.facilityId, incident.facilityId)
      )
    );

  const matchingPolicy = policies.find((policy) => {
    const conditions = policy.conditions as {
      severity?: string[];
      areaId?: string;
    };

    if (conditions.severity && !conditions.severity.includes(incident.severity)) {
      return false;
    }

    if (conditions.areaId && conditions.areaId !== incident.areaId) {
      return false;
    }

    return true;
  });

  if (!matchingPolicy) {
    return null;
  }

  const steps = await db
    .select({
      stepOrder: escalationPolicySteps.stepOrder,
      delayMinutes: escalationPolicySteps.delayMinutes,
      ifUnacked: escalationPolicySteps.ifUnacked
    })
    .from(escalationPolicySteps)
    .where(
      and(
        eq(escalationPolicySteps.organizationId, input.organizationId),
        eq(escalationPolicySteps.policyId, matchingPolicy.id)
      )
    )
    .orderBy(asc(escalationPolicySteps.stepOrder));

  return {
    policyId: matchingPolicy.id,
    steps
  };
}
