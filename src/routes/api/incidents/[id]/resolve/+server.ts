import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { syncGlobalIncidentAnnouncement } from '$lib/server/services/incident-workflow-service';
import { incidentService } from '$lib/server/services/incident-service';
import type { RequestHandler } from './$types';

const payloadSchema = z.object({
  whatHappened: z.string().min(5),
  rootCause: z.string().min(3),
  resolution: z.string().min(3),
  impact: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({})
});

export const POST: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const payload = payloadSchema.parse(await readJson<unknown>(event.request));

    await incidentService.resolveIncident({
      organizationId: getOrganizationId(event),
      incidentId: event.params.id,
      summary: {
        whatHappened: payload.whatHappened,
        rootCause: payload.rootCause,
        resolution: payload.resolution,
        impact: payload.impact
      }
    });
    await syncGlobalIncidentAnnouncement({
      organizationId: getOrganizationId(event),
      incidentId: event.params.id
    });

    return json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.flatten() }, { status: 400 });
    }

    return toErrorResponse(error);
  }
};
