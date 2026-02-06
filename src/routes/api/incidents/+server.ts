import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { listIncidents } from '$lib/server/services/incident-queries';
import { incidentService } from '$lib/server/services/incident-service';
import { incidentSeverities } from '$lib/shared/domain';
import type { RequestHandler } from './$types';

const declareIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  severity: z.enum(incidentSeverities),
  facilityId: z.string().uuid(),
  areaId: z.string().uuid().optional().nullable(),
  assetIds: z.array(z.string().uuid()).optional(),
  assignedToMemberId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  chatPlatform: z.string().default('web'),
  chatChannelRef: z.string().default('web-dashboard')
});

export const GET: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const incidents = await listIncidents(event.locals.organizationId);
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

    const incident = await incidentService.declareIncident({
      organizationId: getOrganizationId(event),
      title: body.title,
      severity: body.severity,
      declaredByMemberId: null,
      facilityId: body.facilityId,
      areaId: body.areaId ?? null,
      assignedToMemberId: body.assignedToMemberId ?? null,
      chatPlatform: body.chatPlatform,
      chatChannelRef: body.chatChannelRef,
      actorExternalId: user.id,
      ...(body.assetIds ? { assetIds: body.assetIds } : {}),
      ...(body.tags ? { tags: body.tags } : {})
    });

    return json({ incident }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.flatten() }, { status: 400 });
    }

    return toErrorResponse(error);
  }
};
