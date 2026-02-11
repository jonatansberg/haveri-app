import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { and, eq, inArray } from 'drizzle-orm';
import { getChatAdapter } from '$lib/server/adapters/chat/factory';
import { db, withTransaction } from '$lib/server/db/client';
import {
  escalationPolicySteps,
  facilities,
  incidentCurrentState,
  incidentEscalationRuntime,
  incidentEscalationStepTargets,
  incidents,
  memberChatIdentities,
  teamMembers,
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

function buildEscalationNotificationMessage(input: {
  severity: string;
  title: string;
  facilityName: string;
  incidentId: string;
  channelRef: string;
  declaredAt: string;
}): string {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(input.declaredAt).getTime()) / 60000));

  return [
    `[${input.severity}] ${input.title}`,
    `Facility: ${input.facilityName}`,
    `Incident: ${input.incidentId}`,
    `Elapsed: ${elapsedMinutes} min`,
    `Channel: ${input.channelRef}`
  ].join('\n');
}

async function resolveStepTargetMemberIds(input: {
  organizationId: string;
  notifyType: string;
  notifyTargetIds: string[];
  activeTeamIds: string[];
}): Promise<string[]> {
  if (input.notifyType === 'member') {
    return [...new Set(input.notifyTargetIds)];
  }

  if (input.notifyType !== 'team' || input.activeTeamIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ memberId: teamMembers.memberId })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.organizationId, input.organizationId),
        inArray(teamMembers.teamId, input.activeTeamIds)
      )
    );

  return [...new Set(rows.map((row) => row.memberId))];
}

async function deliverStepNotifications(input: {
  organizationId: string;
  incidentId: string;
  chatPlatform: string;
  incidentChannelRef: string;
  severity: string;
  incidentTitle: string;
  facilityName: string;
  declaredAt: string;
  targetMemberIds: string[];
}): Promise<{ notifiedMemberIds: string[]; unresolvedMemberIds: string[]; notifiedPlatformUserIds: string[] }> {
  if (input.chatPlatform !== 'teams' || input.targetMemberIds.length === 0) {
    return {
      notifiedMemberIds: input.targetMemberIds,
      unresolvedMemberIds: [],
      notifiedPlatformUserIds: []
    };
  }

  const identities = await db
    .select({
      memberId: memberChatIdentities.memberId,
      platformUserId: memberChatIdentities.platformUserId
    })
    .from(memberChatIdentities)
    .where(
      and(
        eq(memberChatIdentities.organizationId, input.organizationId),
        eq(memberChatIdentities.platform, 'teams'),
        inArray(memberChatIdentities.memberId, input.targetMemberIds)
      )
    );

  const byMemberId = new Map<string, string>();
  for (const identity of identities) {
    if (!byMemberId.has(identity.memberId)) {
      byMemberId.set(identity.memberId, identity.platformUserId);
    }
  }

  const notifiedPlatformUserIds = [...new Set([...byMemberId.values()])];
  const unresolvedMemberIds = input.targetMemberIds.filter((memberId) => !byMemberId.has(memberId));

  if (notifiedPlatformUserIds.length === 0) {
    return {
      notifiedMemberIds: input.targetMemberIds,
      unresolvedMemberIds,
      notifiedPlatformUserIds
    };
  }

  const adapter = getChatAdapter('teams');
  await adapter.addMembers(input.incidentChannelRef, notifiedPlatformUserIds);

  const message = buildEscalationNotificationMessage({
    severity: input.severity,
    title: input.incidentTitle,
    facilityName: input.facilityName,
    incidentId: input.incidentId,
    channelRef: input.incidentChannelRef,
    declaredAt: input.declaredAt
  });

  for (const platformUserId of notifiedPlatformUserIds) {
    await adapter.sendMessage(`dm|${platformUserId}`, message);
  }

  return {
    notifiedMemberIds: input.targetMemberIds,
    unresolvedMemberIds,
    notifiedPlatformUserIds
  };
}

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

  const targetMemberIds = await resolveStepTargetMemberIds({
    organizationId: job.data.organizationId,
    notifyType: step.notifyType,
    notifyTargetIds: step.notifyTargetIds,
    activeTeamIds: activeTargetIds
  });

  const incidentContext = await db
    .select({
      chatPlatform: incidents.chatPlatform,
      chatChannelRef: incidents.chatChannelRef,
      title: incidents.title,
      declaredAt: incidents.declaredAt,
      severity: incidentCurrentState.severity,
      facilityName: facilities.name
    })
    .from(incidents)
    .innerJoin(
      incidentCurrentState,
      and(
        eq(incidentCurrentState.organizationId, incidents.organizationId),
        eq(incidentCurrentState.incidentId, incidents.id)
      )
    )
    .innerJoin(facilities, eq(facilities.id, incidents.facilityId))
    .where(and(eq(incidents.organizationId, job.data.organizationId), eq(incidents.id, job.data.incidentId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!incidentContext) {
    return;
  }

  const notificationResult = await deliverStepNotifications({
    organizationId: job.data.organizationId,
    incidentId: job.data.incidentId,
    chatPlatform: incidentContext.chatPlatform,
    incidentChannelRef: incidentContext.chatChannelRef,
    severity: incidentContext.severity,
    incidentTitle: incidentContext.title,
    facilityName: incidentContext.facilityName,
    declaredAt: incidentContext.declaredAt,
    targetMemberIds
  });

  const now = new Date().toISOString();

  await withTransaction(async (tx) => {
    if (targetMemberIds.length > 0) {
      await tx
        .insert(incidentEscalationStepTargets)
        .values(
          targetMemberIds.map((memberId) => ({
            incidentId: job.data.incidentId,
            organizationId: job.data.organizationId,
            policyId: job.data.policyId,
            stepOrder: step.stepOrder,
            targetMemberId: memberId,
            notifyType: step.notifyType,
            notifiedAt: now,
            acknowledgedAt: null
          }))
        )
        .onConflictDoUpdate({
          target: [
            incidentEscalationStepTargets.incidentId,
            incidentEscalationStepTargets.stepOrder,
            incidentEscalationStepTargets.targetMemberId
          ],
          set: {
            policyId: job.data.policyId,
            notifyType: step.notifyType,
            notifiedAt: now,
            acknowledgedAt: null
          }
        });
    }

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
        inactiveTargetIds,
        targetMemberIds,
        notifiedPlatformUserIds: notificationResult.notifiedPlatformUserIds,
        unresolvedMemberIds: notificationResult.unresolvedMemberIds
      }
    });

    await tx
      .update(incidentEscalationRuntime)
      .set({
        latestStepOrder: step.stepOrder,
        updatedAt: now
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
