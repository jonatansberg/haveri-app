import { asc, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/client';
import { areas, facilities, members } from '$lib/server/db/schema';
import { declareIncidentWithWorkflow } from '$lib/server/services/incident-workflow-service';
import { listIncidents } from '$lib/server/services/incident-queries';
import { incidentSeverities } from '$lib/shared/domain';
import type { Actions, PageServerLoad } from './$types';

const declareSchema = z.object({
  title: z.string().min(3).max(200),
  severity: z.enum(incidentSeverities),
  facilityId: z.string().uuid(),
  assignedToMemberId: z.string().uuid(),
  commsLeadMemberId: z.string().uuid().optional().nullable()
});

export const load: PageServerLoad = async ({ locals, url }) => {
  const status = url.searchParams.getAll('status').filter((value) => value.length > 0);
  const severity = url.searchParams.getAll('severity').filter((value) => value.length > 0);
  const facilityId = url.searchParams.get('facilityId') ?? undefined;
  const areaId = url.searchParams.get('areaId') ?? undefined;
  const dateFrom = url.searchParams.get('dateFrom') ?? undefined;
  const dateTo = url.searchParams.get('dateTo') ?? undefined;

  const [incidents, facilityList, areaList, memberList] = await Promise.all([
    listIncidents({
      organizationId: locals.organizationId,
      filters: {
        ...(status.length > 0 ? { status } : {}),
        ...(severity.length > 0 ? { severity } : {}),
        ...(facilityId ? { facilityId } : {}),
        ...(areaId ? { areaId } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {})
      }
    }),
    db
      .select({ id: facilities.id, name: facilities.name })
      .from(facilities)
      .where(eq(facilities.organizationId, locals.organizationId))
      .orderBy(asc(facilities.name)),
    db
      .select({ id: areas.id, name: areas.name })
      .from(areas)
      .where(eq(areas.organizationId, locals.organizationId))
      .orderBy(asc(areas.name)),
    db
      .select({ id: members.id, name: members.name, role: members.role })
      .from(members)
      .where(eq(members.organizationId, locals.organizationId))
      .orderBy(asc(members.name))
  ]);

  return {
    incidents,
    facilities: facilityList,
    areas: areaList,
    members: memberList,
    filters: {
      status,
      severity,
      facilityId: facilityId ?? '',
      areaId: areaId ?? '',
      dateFrom: dateFrom ?? '',
      dateTo: dateTo ?? ''
    }
  };
};

export const actions: Actions = {
  declare: async ({ request, locals }) => {
    const formData = await request.formData();
    const commsLeadMemberId = formData.get('commsLeadMemberId');

    const parsed = declareSchema.safeParse({
      title: formData.get('title'),
      severity: formData.get('severity'),
      facilityId: formData.get('facilityId'),
      assignedToMemberId: formData.get('assignedToMemberId'),
      commsLeadMemberId:
        typeof commsLeadMemberId === 'string' && commsLeadMemberId.length === 0
          ? null
          : commsLeadMemberId
    });

    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.flatten()
      });
    }

    const declared = await declareIncidentWithWorkflow({
      organizationId: locals.organizationId,
      title: parsed.data.title,
      severity: parsed.data.severity,
      declaredByMemberId: null,
      facilityId: parsed.data.facilityId,
      responsibleLeadMemberId: parsed.data.assignedToMemberId,
      commsLeadMemberId: parsed.data.commsLeadMemberId ?? null,
      chatPlatform: 'teams',
      sourceChannelRef: null
    });

    throw redirect(303, `/incidents/${declared.incidentId}`);
  }
};
