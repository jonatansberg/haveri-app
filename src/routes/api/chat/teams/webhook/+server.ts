import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { handleTeamsInbound } from '$lib/server/adapters/teams/adapter';
import type { TeamsInboundMessage } from '$lib/server/adapters/teams/adapter';
import { getDefaultOrgId } from '$lib/server/services/env';
import {
  getIdempotentResponse,
  storeIdempotentResponse
} from '$lib/server/services/idempotency-service';
import type { RequestHandler } from './$types';

const teamsPayloadSchema = z.object({
  id: z.string().min(1),
  type: z.literal('message'),
  text: z.string(),
  channelId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().optional(),
  timestamp: z.string().optional()
});

export const POST: RequestHandler = async (event) => {
  try {
    const orgId = event.request.headers.get('x-org-id') ?? getDefaultOrgId();
    const payload = teamsPayloadSchema.parse(await readJson<unknown>(event.request));

    const existing = await getIdempotentResponse(orgId, 'teams', payload.id);
    if (existing) {
      return json(existing);
    }

    const inbound: TeamsInboundMessage = {
      id: payload.id,
      type: payload.type,
      text: payload.text,
      channelId: payload.channelId,
      userId: payload.userId,
      ...(payload.userName ? { userName: payload.userName } : {}),
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {})
    };

    const response = await handleTeamsInbound(orgId, inbound);

    await storeIdempotentResponse({
      organizationId: orgId,
      platform: 'teams',
      idempotencyKey: payload.id,
      responsePayload: response
    });

    return json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.flatten() }, { status: 400 });
    }

    return toErrorResponse(error);
  }
};
