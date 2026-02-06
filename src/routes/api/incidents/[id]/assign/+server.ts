import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { syncGlobalIncidentAnnouncement } from '$lib/server/services/incident-workflow-service';
import { incidentService } from '$lib/server/services/incident-service';
import type { RequestHandler } from './$types';

const payloadSchema = z.object({
  memberId: z.string().uuid()
});

export const POST: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const payload = payloadSchema.parse(await readJson<unknown>(event.request));

    await incidentService.assignLead({
      organizationId: getOrganizationId(event),
      incidentId: event.params.id,
      memberId: payload.memberId
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
