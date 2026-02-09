import { and, eq } from 'drizzle-orm';
import { withTransaction } from '$lib/server/db/client';
import { incidentEscalationRuntime } from '$lib/server/db/schema';
import { selectEscalationPolicyForIncident } from '$lib/server/services/escalation-service';
import { appendIncidentEvent } from '$lib/server/services/event-store';
import { getEscalationQueue } from './queue';

export async function scheduleEscalationForIncident(input: {
  organizationId: string;
  incidentId: string;
}): Promise<{ scheduled: boolean; reason?: string }> {
  const policy = await selectEscalationPolicyForIncident(input);

  if (!policy) {
    await withTransaction(async (tx) => {
      await tx
        .update(incidentEscalationRuntime)
        .set({
          policyId: null,
          ackedAt: null,
          ackedByMemberId: null,
          latestStepOrder: 1,
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
        actorType: 'system',
        payload: {
          action: 'fallback_declaring_team',
          reason: 'No matching policy'
        }
      });
    });

    return { scheduled: true, reason: 'Fallback to declaring team' };
  }

  await withTransaction(async (tx) => {
    await tx
      .update(incidentEscalationRuntime)
      .set({
        policyId: policy.policyId,
        ackedAt: null,
        ackedByMemberId: null,
        latestStepOrder: 0,
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
      actorType: 'system',
      payload: {
        action: 'policy_selected',
        policyId: policy.policyId,
        stepCount: policy.steps.length
      }
    });
  });

  const queue = getEscalationQueue();

  for (const step of policy.steps) {
    await queue.add(
      'run-step',
      {
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        policyId: policy.policyId,
        stepOrder: step.stepOrder
      },
      {
        delay: Math.max(0, step.delayMinutes * 60_000),
        jobId: `${input.incidentId}:${step.stepOrder}`
      }
    );
  }

  return { scheduled: true };
}
