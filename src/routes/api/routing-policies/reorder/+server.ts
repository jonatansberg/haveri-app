import { json } from '@sveltejs/kit';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { reorderRoutingPolicies } from '$lib/server/services/routing-policy-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  try {
    requireUser(event);
    const organizationId = getOrganizationId(event);
    const payload = await readJson<{ orderedPolicyIds: string[] }>(event.request);

    const policies = await reorderRoutingPolicies({
      organizationId,
      orderedPolicyIds: payload.orderedPolicyIds
    });

    return json({ policies });
  } catch (error) {
    return toErrorResponse(error);
  }
};
