import { asc, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db/client';
import { areas, assets, facilities, members } from '$lib/server/db/schema';
import { declareIncidentWithWorkflow } from '$lib/server/services/incident-workflow-service';
import { listIncidents } from '$lib/server/services/incident-queries';
import { incidentSeverities } from '$lib/shared/domain';
import type { Actions, PageServerLoad } from './$types';

const declareSchema = z.object({
  title: z.string().min(3).max(200),
  severity: z.enum(incidentSeverities),
  facilityId: z.string().uuid(),
  areaId: z.string().uuid().optional().nullable(),
  assetIds: z.array(z.string().uuid()).optional(),
  description: z.string().min(3).max(2000).optional().nullable(),
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

  const [incidents, facilityList, areaList, assetList, memberList] = await Promise.all([
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
      .select({ id: assets.id, name: assets.name, areaId: assets.areaId })
      .from(assets)
      .where(eq(assets.organizationId, locals.organizationId))
      .orderBy(asc(assets.name)),
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
    assets: assetList,
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
    const areaId = formData.get('areaId');
    const description = formData.get('description');
    const assetIds = formData
      .getAll('assetIds')
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    const parsed = declareSchema.safeParse({
      title: formData.get('title'),
      severity: formData.get('severity'),
      facilityId: formData.get('facilityId'),
      areaId: typeof areaId === 'string' && areaId.length === 0 ? null : areaId,
      assetIds: assetIds.length > 0 ? assetIds : undefined,
      description: typeof description === 'string' && description.length === 0 ? null : description,
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
      areaId: parsed.data.areaId ?? null,
      ...(parsed.data.assetIds ? { assetIds: parsed.data.assetIds } : {}),
      description: parsed.data.description ?? null,
      responsibleLeadMemberId: parsed.data.assignedToMemberId,
      commsLeadMemberId: parsed.data.commsLeadMemberId ?? null,
      chatPlatform: 'teams',
      sourceChannelRef: null
    });

    throw redirect(303, `/incidents/${declared.incidentId}`);
  }
};
