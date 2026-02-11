import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { facilities, members } from '$lib/server/db/schema';
import { listFollowUps } from '$lib/server/services/follow-up-service';
import { followUpStatuses } from '$lib/shared/domain';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const status = url.searchParams.get('status');
  const assignedToMemberId = url.searchParams.get('assignedToMemberId');
  const facilityId = url.searchParams.get('facilityId');
  const overdue = url.searchParams.get('overdue') === 'true';
  const parsedStatus =
    status && followUpStatuses.includes(status as (typeof followUpStatuses)[number])
      ? (status as (typeof followUpStatuses)[number])
      : undefined;

  const [followUps, memberList, facilityList] = await Promise.all([
    listFollowUps({
      organizationId: locals.organizationId,
      ...(parsedStatus ? { status: parsedStatus } : {}),
      ...(assignedToMemberId ? { assignedToMemberId } : {}),
      ...(facilityId ? { facilityId } : {}),
      ...(overdue ? { overdue: true } : {})
    }),
    db
      .select({ id: members.id, name: members.name, role: members.role })
      .from(members)
      .where(eq(members.organizationId, locals.organizationId))
      .orderBy(asc(members.name)),
    db
      .select({ id: facilities.id, name: facilities.name })
      .from(facilities)
      .where(eq(facilities.organizationId, locals.organizationId))
      .orderBy(asc(facilities.name))
  ]);

  return {
    followUps,
    members: memberList,
    facilities: facilityList,
    filters: {
      status: parsedStatus ?? '',
      assignedToMemberId: assignedToMemberId ?? '',
      facilityId: facilityId ?? '',
      overdue
    }
  };
};
