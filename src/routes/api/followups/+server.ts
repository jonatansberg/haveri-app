import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { listFollowUps, updateFollowUpStatus } from '$lib/server/services/follow-up-service';
import { followUpStatuses } from '$lib/shared/domain';
import type { RequestHandler } from './$types';

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(followUpStatuses)
});

export const GET: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const incidentId = event.url.searchParams.get('incidentId');
    const organizationId = getOrganizationId(event);
    const followUps = await listFollowUps(
      incidentId ? { organizationId, incidentId } : { organizationId }
    );

    return json({ followUps });
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const PATCH: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const payload = updateSchema.parse(await readJson<unknown>(event.request));

    await updateFollowUpStatus({
      organizationId: getOrganizationId(event),
      followUpId: payload.id,
      status: payload.status
    });

    return json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.flatten() }, { status: 400 });
    }

    return toErrorResponse(error);
  }
};
