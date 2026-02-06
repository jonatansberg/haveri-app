import { json } from '@sveltejs/kit';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { toErrorResponse } from '$lib/server/api/http';
import { acknowledgeIncidentEscalation } from '$lib/server/services/escalation-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  requireUser(event);

  try {
    await acknowledgeIncidentEscalation({
      organizationId: getOrganizationId(event),
      incidentId: event.params.id
    });

    return json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
};
