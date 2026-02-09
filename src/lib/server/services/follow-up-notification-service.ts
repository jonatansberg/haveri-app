import { and, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import { getChatAdapter } from '$lib/server/adapters/chat/factory';
import { db } from '$lib/server/db/client';
import {
  followUpReminderLog,
  followUps,
  incidentCurrentState,
  incidents,
  memberChatIdentities
} from '$lib/server/db/schema';
import { computeReminderType } from '$lib/server/services/follow-up-reminder-rules';

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function getTeamsUserIdsForMembers(input: {
  organizationId: string;
  memberIds: string[];
}): Promise<Map<string, string>> {
  if (input.memberIds.length === 0) {
    return new Map();
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
        inArray(memberChatIdentities.memberId, input.memberIds)
      )
    );

  const byMember = new Map<string, string>();
  for (const identity of identities) {
    if (!byMember.has(identity.memberId)) {
      byMember.set(identity.memberId, identity.platformUserId);
    }
  }

  return byMember;
}

export async function notifyFollowUpAssignments(input: {
  organizationId: string;
  incidentId: string;
  incidentTitle: string;
  followUps: {
    id: string;
    description: string;
    assignedToMemberId: string | null;
    dueDate: string | null;
  }[];
}): Promise<void> {
  const assigned = input.followUps.filter((followUp) => followUp.assignedToMemberId);
  if (assigned.length === 0) {
    return;
  }

  const memberIds = assigned
    .map((followUp) => followUp.assignedToMemberId)
    .filter((memberId): memberId is string => Boolean(memberId));

  const byMember = await getTeamsUserIdsForMembers({
    organizationId: input.organizationId,
    memberIds
  });

  const adapter = getChatAdapter('teams');

  for (const followUp of assigned) {
    if (!followUp.assignedToMemberId) {
      continue;
    }

    const platformUserId = byMember.get(followUp.assignedToMemberId);
    if (!platformUserId) {
      continue;
    }

    const dueDateLine = followUp.dueDate ? `Due: ${followUp.dueDate}` : 'Due: not set';
    const content = [
      'You have a new Haveri follow-up assignment.',
      `Incident: ${input.incidentTitle} (${input.incidentId})`,
      `Task: ${followUp.description}`,
      dueDateLine
    ].join('\n');

    await adapter.sendMessage(`dm|${platformUserId}`, content);
  }
}

export async function sendFollowUpReminders(input: {
  organizationId: string;
  referenceDate?: Date;
}): Promise<{ sent: number }> {
  const referenceDate = input.referenceDate ?? new Date();
  const reminderDate = toDateOnly(referenceDate);

  const candidates = await db
    .select({
      id: followUps.id,
      dueDate: followUps.dueDate,
      description: followUps.description,
      assignedToMemberId: followUps.assignedToMemberId,
      incidentId: followUps.incidentId,
      incidentTitle: incidents.title
    })
    .from(followUps)
    .innerJoin(
      incidents,
      and(eq(incidents.id, followUps.incidentId), eq(incidents.organizationId, followUps.organizationId))
    )
    .innerJoin(
      incidentCurrentState,
      and(
        eq(incidentCurrentState.incidentId, incidents.id),
        eq(incidentCurrentState.organizationId, incidents.organizationId)
      )
    )
    .where(
      and(
        eq(followUps.organizationId, input.organizationId),
        isNotNull(followUps.assignedToMemberId),
        isNotNull(followUps.dueDate),
        ne(followUps.status, 'DONE')
      )
    );

  const reminderCandidates = candidates
    .map((candidate) => {
      const reminderType = computeReminderType({
        dueDate: candidate.dueDate,
        referenceDate
      });

      if (!reminderType || !candidate.assignedToMemberId) {
        return null;
      }

      return {
        followUpId: candidate.id,
        reminderType,
        dueDate: candidate.dueDate,
        description: candidate.description,
        assignedToMemberId: candidate.assignedToMemberId,
        incidentId: candidate.incidentId,
        incidentTitle: candidate.incidentTitle
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  if (reminderCandidates.length === 0) {
    return { sent: 0 };
  }

  const existingLogs = await db
    .select({
      followUpId: followUpReminderLog.followUpId,
      reminderType: followUpReminderLog.reminderType
    })
    .from(followUpReminderLog)
    .where(
      and(
        eq(followUpReminderLog.organizationId, input.organizationId),
        eq(followUpReminderLog.reminderDate, reminderDate),
        inArray(
          followUpReminderLog.followUpId,
          reminderCandidates.map((candidate) => candidate.followUpId)
        )
      )
    );

  const existingKey = new Set(existingLogs.map((row) => `${row.followUpId}|${row.reminderType}`));

  const pending = reminderCandidates.filter(
    (candidate) => !existingKey.has(`${candidate.followUpId}|${candidate.reminderType}`)
  );

  if (pending.length === 0) {
    return { sent: 0 };
  }

  const memberIds = pending.map((candidate) => candidate.assignedToMemberId);
  const byMember = await getTeamsUserIdsForMembers({
    organizationId: input.organizationId,
    memberIds
  });

  const adapter = getChatAdapter('teams');
  let sent = 0;

  for (const reminder of pending) {
    const platformUserId = byMember.get(reminder.assignedToMemberId);
    if (!platformUserId) {
      continue;
    }

    const reminderLabel =
      reminder.reminderType === 'DUE_TOMORROW'
        ? 'due tomorrow'
        : reminder.reminderType === 'DUE_TODAY'
          ? 'due today'
          : 'overdue by 1 day';

    const content = [
      `Follow-up reminder (${reminderLabel}).`,
      `Incident: ${reminder.incidentTitle} (${reminder.incidentId})`,
      `Task: ${reminder.description}`,
      `Due: ${reminder.dueDate}`
    ].join('\n');

    await adapter.sendMessage(`dm|${platformUserId}`, content);

    await db.insert(followUpReminderLog).values({
      organizationId: input.organizationId,
      followUpId: reminder.followUpId,
      reminderType: reminder.reminderType,
      reminderDate
    });

    sent += 1;
  }

  return { sent };
}
