import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { handleTeamsInbound } from '$lib/server/adapters/teams/adapter';
import type { TeamsInboundMessage } from '$lib/server/adapters/teams/adapter';
import { getDefaultOrgId } from '$lib/server/services/env';
import { ValidationError } from '$lib/server/services/errors';
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

const teamsActivityPayloadSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal('message'),
    text: z.string().optional(),
    timestamp: z.string().optional(),
    from: z
      .object({
        id: z.string().optional(),
        aadObjectId: z.string().optional(),
        name: z.string().optional()
      })
      .optional(),
    conversation: z
      .object({
        id: z.string().optional()
      })
      .optional(),
    channelData: z
      .object({
        channel: z
          .object({
            id: z.string().optional()
          })
          .optional()
      })
      .optional()
  })
  .passthrough();

const teamsWebhookPayloadSchema = z.union([teamsPayloadSchema, teamsActivityPayloadSchema]);
type LegacyTeamsWebhookPayload = z.infer<typeof teamsPayloadSchema>;
type TeamsActivityWebhookPayload = z.infer<typeof teamsActivityPayloadSchema>;

function isLegacyTeamsWebhookPayload(
  payload: LegacyTeamsWebhookPayload | TeamsActivityWebhookPayload
): payload is LegacyTeamsWebhookPayload {
  return (
    Object.prototype.hasOwnProperty.call(payload, 'userId') &&
    typeof (payload as Record<string, unknown>)['userId'] === 'string'
  );
}

function stripTeamsMentions(text: string): string {
  return text.replace(/<at>[^<]*<\/at>/gi, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function toTeamsInbound(
  payload: LegacyTeamsWebhookPayload | TeamsActivityWebhookPayload
): TeamsInboundMessage {
  if (isLegacyTeamsWebhookPayload(payload)) {
    return {
      id: payload.id,
      type: payload.type,
      text: payload.text,
      channelId: payload.channelId,
      userId: payload.userId,
      ...(payload.userName ? { userName: payload.userName } : {}),
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {})
    };
  }

  const channelId = payload.channelData?.channel?.id ?? payload.conversation?.id ?? null;
  const userId = payload.from?.aadObjectId ?? payload.from?.id ?? null;
  const text = stripTeamsMentions(payload.text ?? '');

  if (!channelId) {
    throw new ValidationError('Teams activity payload is missing channel reference');
  }

  if (!userId) {
    throw new ValidationError('Teams activity payload is missing user reference');
  }

  return {
    id: payload.id,
    type: 'message',
    text,
    channelId,
    userId,
    ...(payload.from?.name ? { userName: payload.from.name } : {}),
    ...(payload.timestamp ? { timestamp: payload.timestamp } : {})
  };
}

export const POST: RequestHandler = async (event) => {
  try {
    const orgId = event.request.headers.get('x-org-id') ?? getDefaultOrgId();
    const payload = teamsWebhookPayloadSchema.parse(await readJson<unknown>(event.request));
    const inbound = toTeamsInbound(payload);

    const existing = await getIdempotentResponse(orgId, 'teams', inbound.id);
    if (existing) {
      return json(existing);
    }

    const response = await handleTeamsInbound(orgId, inbound);

    await storeIdempotentResponse({
      organizationId: orgId,
      platform: 'teams',
      idempotencyKey: inbound.id,
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
