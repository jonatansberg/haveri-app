import { json } from '@sveltejs/kit';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { toErrorResponse } from '$lib/server/api/http';
import { getIncidentDetail } from '$lib/server/services/incident-queries';
import { staticIncidentWorkflow } from '$lib/server/services/incident-workflow-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const detail = await getIncidentDetail(getOrganizationId(event), event.params.id);
    return json({
      ...detail,
      workflow: staticIncidentWorkflow
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
