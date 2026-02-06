import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getOrganizationId, requireUser } from '$lib/server/auth-utils';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { incidentService } from '$lib/server/services/incident-service';
import type { RequestHandler } from './$types';

const payloadSchema = z.object({
  followUps: z
    .array(
      z.object({
        description: z.string().min(3),
        assignedToMemberId: z.string().uuid().optional().nullable(),
        dueDate: z.string().date().optional().nullable()
      })
    )
    .default([])
});

export const POST: RequestHandler = async (event) => {
  requireUser(event);

  try {
    const payload = payloadSchema.parse(await readJson<unknown>(event.request));

    await incidentService.closeIncident({
      organizationId: getOrganizationId(event),
      incidentId: event.params.id,
      followUps: payload.followUps.map((followUp) => ({
        description: followUp.description,
        assignedToMemberId: followUp.assignedToMemberId ?? null,
        dueDate: followUp.dueDate ?? null
      }))
    });

    return json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.flatten() }, { status: 400 });
    }

    return toErrorResponse(error);
  }
};
