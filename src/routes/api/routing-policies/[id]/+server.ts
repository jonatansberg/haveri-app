import { json } from '@sveltejs/kit';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { deleteRoutingPolicy, updateRoutingPolicy } from '$lib/server/services/routing-policy-service';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async (event) => {
  try {
    requireUser(event);
    const organizationId = getOrganizationId(event);
    const payload = await readJson<{
      name?: string;
      facilityId?: string | null;
      isActive?: boolean;
      conditions?: unknown;
      steps?: unknown;
    }>(event.request);

    const result = await updateRoutingPolicy({
      organizationId,
      policyId: event.params.id,
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.facilityId !== undefined ? { facilityId: payload.facilityId } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.conditions !== undefined ? { conditions: payload.conditions } : {}),
      ...(payload.steps !== undefined ? { steps: payload.steps } : {})
    });

    return json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const DELETE: RequestHandler = async (event) => {
  try {
    requireUser(event);
    const organizationId = getOrganizationId(event);

    await deleteRoutingPolicy({
      organizationId,
      policyId: event.params.id
    });

    return json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
};
