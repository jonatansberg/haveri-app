import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { followUps, incidents } from '$lib/server/db/schema';
import type { FollowUpStatus } from '$lib/shared/domain';
import { NotFoundError } from './errors';

export async function listFollowUps(input: {
  organizationId: string;
  incidentId?: string;
  status?: FollowUpStatus;
  assignedToMemberId?: string;
  facilityId?: string;
  overdue?: boolean;
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
  const predicates = [eq(followUps.organizationId, input.organizationId)];

  if (input.incidentId) {
    predicates.push(eq(followUps.incidentId, input.incidentId));
  }

  if (input.status) {
    predicates.push(eq(followUps.status, input.status));
  }

  if (input.assignedToMemberId) {
    predicates.push(eq(followUps.assignedToMemberId, input.assignedToMemberId));
  }

  if (input.facilityId) {
    predicates.push(eq(incidents.facilityId, input.facilityId));
  }

  if (input.overdue) {
    predicates.push(
      sql`${followUps.dueDate} < CURRENT_DATE AND ${followUps.status} <> 'DONE'::follow_up_status`
    );
  }

  const overdueSort = sql<number>`CASE WHEN ${followUps.dueDate} < CURRENT_DATE AND ${followUps.status} <> 'DONE'::follow_up_status THEN 0 ELSE 1 END`;

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
    .innerJoin(
      incidents,
      and(
        eq(incidents.id, followUps.incidentId),
        eq(incidents.organizationId, followUps.organizationId)
      )
    )
    .where(and(...predicates))
    .orderBy(asc(overdueSort), asc(followUps.dueDate), desc(followUps.updatedAt));
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
