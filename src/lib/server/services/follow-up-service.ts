import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { followUps } from '$lib/server/db/schema';
import type { FollowUpStatus } from '$lib/shared/domain';
import { NotFoundError } from './errors';

export async function listFollowUps(input: {
  organizationId: string;
  incidentId?: string;
}): Promise<
  {
    id: string;
    incidentId: string;
    description: string;
    status: FollowUpStatus;
    dueDate: string | null;
    assignedToMemberId: string | null;
    updatedAt: string;
  }[]
> {
  const where = input.incidentId
    ? and(
        eq(followUps.organizationId, input.organizationId),
        eq(followUps.incidentId, input.incidentId)
      )
    : eq(followUps.organizationId, input.organizationId);

  return db
    .select({
      id: followUps.id,
      incidentId: followUps.incidentId,
      description: followUps.description,
      status: followUps.status,
      dueDate: followUps.dueDate,
      assignedToMemberId: followUps.assignedToMemberId,
      updatedAt: followUps.updatedAt
    })
    .from(followUps)
    .where(where)
    .orderBy(desc(followUps.updatedAt));
}

export async function updateFollowUpStatus(input: {
  organizationId: string;
  followUpId: string;
  status: FollowUpStatus;
}): Promise<void> {
  const updated = await db
    .update(followUps)
    .set({
      status: input.status,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(followUps.organizationId, input.organizationId), eq(followUps.id, input.followUpId)))
    .returning({ id: followUps.id });

  if (!updated.length) {
    throw new NotFoundError(`Follow-up ${input.followUpId} not found`);
  }
}
