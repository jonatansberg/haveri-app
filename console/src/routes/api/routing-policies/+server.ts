import { json } from '@sveltejs/kit';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { createRoutingPolicy, listRoutingPolicies } from '$lib/server/services/routing-policy-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  try {
    requireUser(event);
    const organizationId = getOrganizationId(event);
    const policies = await listRoutingPolicies(organizationId);
    return json({ policies });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST: RequestHandler = async (event) => {
  try {
    requireUser(event);
    const organizationId = getOrganizationId(event);
    const payload = await readJson<{
      name: string;
      facilityId?: string | null;
      isActive?: boolean;
      conditions?: unknown;
      steps: unknown;
    }>(event.request);

    const result = await createRoutingPolicy({
      organizationId,
      name: payload.name,
      ...(payload.facilityId !== undefined ? { facilityId: payload.facilityId } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.conditions !== undefined ? { conditions: payload.conditions } : {}),
      steps: payload.steps
    });

    return json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
};
