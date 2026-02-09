import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { and, eq, inArray } from 'drizzle-orm';
import { db, withTransaction } from '$lib/server/db/client';
import {
  escalationPolicySteps,
  facilities,
  incidentEscalationRuntime,
  teams
} from '$lib/server/db/schema';
import { appendIncidentEvent } from '$lib/server/services/event-store';
import { getRedisUrl } from '$lib/server/services/env';
import { partitionTeamsByActivity } from '$lib/server/services/team-schedule-service';
import type { EscalationJobData } from './types';

const connection = new IORedis(getRedisUrl(), {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

async function processEscalationJob(job: Job<EscalationJobData>): Promise<void> {
  const runtime = await db
    .select({
      ackedAt: incidentEscalationRuntime.ackedAt,
      latestStepOrder: incidentEscalationRuntime.latestStepOrder
    })
    .from(incidentEscalationRuntime)
    .where(
      and(
        eq(incidentEscalationRuntime.organizationId, job.data.organizationId),
        eq(incidentEscalationRuntime.incidentId, job.data.incidentId),
        eq(incidentEscalationRuntime.policyId, job.data.policyId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!runtime) {
    return;
  }

  const step = await db
    .select({
      stepOrder: escalationPolicySteps.stepOrder,
      notifyType: escalationPolicySteps.notifyType,
      notifyTargetIds: escalationPolicySteps.notifyTargetIds,
      ifUnacked: escalationPolicySteps.ifUnacked,
      delayMinutes: escalationPolicySteps.delayMinutes
    })
    .from(escalationPolicySteps)
    .where(
      and(
        eq(escalationPolicySteps.organizationId, job.data.organizationId),
        eq(escalationPolicySteps.policyId, job.data.policyId),
        eq(escalationPolicySteps.stepOrder, job.data.stepOrder)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!step) {
    return;
  }

  if (runtime.ackedAt && step.ifUnacked) {
    return;
  }

  let activeTargetIds = step.notifyTargetIds;
  let inactiveTargetIds: string[] = [];

  if (step.notifyType === 'team' && step.notifyTargetIds.length > 0) {
    const teamRows = await db
      .select({
        teamId: teams.id,
        shiftInfo: teams.shiftInfo,
        timezone: facilities.timezone
      })
      .from(teams)
      .leftJoin(facilities, eq(facilities.id, teams.facilityId))
      .where(
        and(
          eq(teams.organizationId, job.data.organizationId),
          inArray(teams.id, step.notifyTargetIds)
        )
      );

    const partition = partitionTeamsByActivity(teamRows);
    activeTargetIds = partition.activeTeamIds;
    inactiveTargetIds = partition.inactiveTeamIds;
  }

  await withTransaction(async (tx) => {
    await appendIncidentEvent(tx, {
      organizationId: job.data.organizationId,
      incidentId: job.data.incidentId,
      eventType: 'escalation',
      eventVersion: 1,
      schemaVersion: 1,
      actorType: 'system',
      payload: {
        action: 'step_executed',
        stepOrder: step.stepOrder,
        notifyType: step.notifyType,
        delayMinutes: step.delayMinutes,
        notifyTargetIds: step.notifyTargetIds,
        activeTargetIds,
        inactiveTargetIds
      }
    });

    await tx
      .update(incidentEscalationRuntime)
      .set({
        latestStepOrder: step.stepOrder,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(incidentEscalationRuntime.organizationId, job.data.organizationId),
          eq(incidentEscalationRuntime.incidentId, job.data.incidentId)
        )
      );
  });
}

const worker = new Worker<EscalationJobData>('incident-escalation', processEscalationJob, {
  connection
});

worker.on('completed', (job) => {
  console.log(`Escalation job completed: ${job.id}`);
});

worker.on('failed', (job, error) => {
  console.error(`Escalation job failed: ${job?.id ?? 'unknown'}`, error);
});

console.log('Escalation worker started');
