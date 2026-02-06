import { asc, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/client';
import { facilities, members } from '$lib/server/db/schema';
import { incidentService } from '$lib/server/services/incident-service';
import { listIncidents } from '$lib/server/services/incident-queries';
import { scheduleEscalationForIncident } from '$lib/server/queue/scheduler';
import { incidentSeverities } from '$lib/shared/domain';
import type { Actions, PageServerLoad } from './$types';

const declareSchema = z.object({
  title: z.string().min(3).max(200),
  severity: z.enum(incidentSeverities),
  facilityId: z.string().uuid(),
  assignedToMemberId: z.string().uuid().optional().nullable()
});

export const load: PageServerLoad = async ({ locals }) => {
  const [incidents, facilityList, memberList] = await Promise.all([
    listIncidents(locals.organizationId),
    db
      .select({ id: facilities.id, name: facilities.name })
      .from(facilities)
      .where(eq(facilities.organizationId, locals.organizationId))
      .orderBy(asc(facilities.name)),
    db
      .select({ id: members.id, name: members.name, role: members.role })
      .from(members)
      .where(eq(members.organizationId, locals.organizationId))
      .orderBy(asc(members.name))
  ]);

  return {
    incidents,
    facilities: facilityList,
    members: memberList
  };
};

export const actions: Actions = {
  declare: async ({ request, locals }) => {
    const formData = await request.formData();

    const parsed = declareSchema.safeParse({
      title: formData.get('title'),
      severity: formData.get('severity'),
      facilityId: formData.get('facilityId'),
      assignedToMemberId: formData.get('assignedToMemberId') ?? null
    });

    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.flatten()
      });
    }

    const incident = await incidentService.declareIncident({
      organizationId: locals.organizationId,
      title: parsed.data.title,
      severity: parsed.data.severity,
      declaredByMemberId: null,
      facilityId: parsed.data.facilityId,
      chatPlatform: 'web',
      chatChannelRef: `web-${Date.now()}`,
      ...(parsed.data.assignedToMemberId
        ? { assignedToMemberId: parsed.data.assignedToMemberId }
        : {})
    });

    try {
      await scheduleEscalationForIncident({
        organizationId: locals.organizationId,
        incidentId: incident.id
      });
    } catch (error) {
      console.error('Failed to schedule escalation from dashboard action', error);
    }

    throw redirect(303, `/incidents/${incident.id}`);
  }
};
