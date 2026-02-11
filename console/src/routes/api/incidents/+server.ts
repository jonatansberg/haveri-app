import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { listIncidents } from '$lib/server/services/incident-queries';
import { declareIncidentWithWorkflow } from '$lib/server/services/incident-workflow-service';
import { incidentSeverities } from '$lib/shared/domain';
import type { RequestHandler } from './$types';

const declareIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  severity: z.enum(incidentSeverities),
  facilityId: z.string().uuid(),
  areaId: z.string().uuid().optional().nullable(),
  assetIds: z.array(z.string().uuid()).optional(),
  description: z.string().min(3).max(2000).optional().nullable(),
  assignedToMemberId: z.string().uuid().optional().nullable(),
  commsLeadMemberId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  chatPlatform: z.enum(['teams', 'web']).default('teams'),
  sourceChannelRef: z.string().optional().nullable()
});

export const GET: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const status = event.url.searchParams.getAll('status').filter((value) => value.length > 0);
    const severity = event.url.searchParams
      .getAll('severity')
      .filter((value) => value.length > 0);
    const facilityId = event.url.searchParams.get('facilityId') ?? undefined;
    const areaId = event.url.searchParams.get('areaId') ?? undefined;
    const dateFrom = event.url.searchParams.get('dateFrom') ?? undefined;
    const dateTo = event.url.searchParams.get('dateTo') ?? undefined;

    const incidents = await listIncidents({
      organizationId: event.locals.organizationId,
      filters: {
        ...(status.length > 0 ? { status } : {}),
        ...(severity.length > 0 ? { severity } : {}),
        ...(facilityId ? { facilityId } : {}),
        ...(areaId ? { areaId } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {})
      }
    });
    return json({ incidents });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);

  try {
    const rawBody = await readJson<unknown>(event.request);
    const body = declareIncidentSchema.parse(rawBody);

    const declared = await declareIncidentWithWorkflow({
      organizationId: getOrganizationId(event),
      title: body.title,
      severity: body.severity,
      declaredByMemberId: null,
      facilityId: body.facilityId,
      areaId: body.areaId ?? null,
      description: body.description ?? null,
      responsibleLeadMemberId: body.assignedToMemberId ?? null,
      commsLeadMemberId: body.commsLeadMemberId ?? null,
      chatPlatform: body.chatPlatform,
      sourceChannelRef: body.sourceChannelRef ?? null,
      actorExternalId: user.id,
      ...(body.assetIds ? { assetIds: body.assetIds } : {}),
      ...(body.tags ? { tags: body.tags } : {})
    });

    return json({ incidentId: declared.incidentId, channelRef: declared.channelRef }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.flatten() }, { status: 400 });
    }

    return toErrorResponse(error);
  }
};
