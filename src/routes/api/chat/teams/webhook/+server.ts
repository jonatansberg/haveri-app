import { json } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { readJson, toErrorResponse } from '$lib/server/api/http';
import { handleTeamsInbound } from '$lib/server/adapters/teams/adapter';
import type { TeamsInboundMessage } from '$lib/server/adapters/teams/adapter';
import { getDefaultOrgId, getTeamsBotAppId, getTeamsWebhookSecret } from '$lib/server/services/env';
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
  tenantId: z.string().optional(),
  userName: z.string().optional(),
  timestamp: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().optional(),
        contentType: z.string().optional(),
        contentUrl: z.string().optional()
      })
    )
    .optional()
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
        id: z.string().optional(),
        tenantId: z.string().optional()
      })
      .optional(),
    channelData: z
      .object({
        channel: z
          .object({
            id: z.string().optional()
          })
          .optional(),
        tenant: z
          .object({
            id: z.string().optional()
          })
          .optional()
      })
      .optional(),
    attachments: z
      .array(
        z.object({
          name: z.string().optional(),
          contentType: z.string().optional(),
          contentUrl: z.string().optional()
        })
      )
      .optional(),
    value: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const teamsWebhookPayloadSchema = z.union([teamsPayloadSchema, teamsActivityPayloadSchema]);
type LegacyTeamsWebhookPayload = z.infer<typeof teamsPayloadSchema>;
type TeamsActivityWebhookPayload = z.infer<typeof teamsActivityPayloadSchema>;

interface WebhookRequestLogContext {
  requestId: string | null;
  orgId: string;
  method: string;
  path: string;
  host: string | null;
  forwardedHost: string | null;
  forwardedProto: string | null;
  forwardedFor: string | null;
  contentType: string | null;
  contentLength: string | null;
  userAgent: string | null;
}

function normalizeAttachments(
  attachments:
    | {
        name?: string | undefined;
        contentType?: string | undefined;
        contentUrl?: string | undefined;
      }[]
    | undefined
): {
  name: string | null;
  contentType: string | null;
  contentUrl: string | null;
}[] {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  return attachments.map((attachment) => ({
    name: attachment.name ?? null,
    contentType: attachment.contentType ?? null,
    contentUrl: attachment.contentUrl ?? null
  }));
}

function getRequestLogContext(event: Parameters<RequestHandler>[0], orgId: string): WebhookRequestLogContext {
  const url = new URL(event.request.url);

  return {
    requestId:
      event.request.headers.get('fly-request-id') ??
      event.request.headers.get('x-request-id') ??
      event.request.headers.get('traceparent'),
    orgId,
    method: event.request.method,
    path: url.pathname,
    host: event.request.headers.get('host'),
    forwardedHost: event.request.headers.get('x-forwarded-host'),
    forwardedProto: event.request.headers.get('x-forwarded-proto'),
    forwardedFor: event.request.headers.get('x-forwarded-for'),
    contentType: event.request.headers.get('content-type'),
    contentLength: event.request.headers.get('content-length'),
    userAgent: event.request.headers.get('user-agent')
  };
}

function summarizePayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return { payloadType: typeof payload };
  }

  const source = payload as Record<string, unknown>;
  const rawText = typeof source['text'] === 'string' ? source['text'] : null;
  const sanitizedText = rawText
    ? stripTeamsMentions(rawText).replace(/\s+/g, ' ').trim().slice(0, 180)
    : null;

  return {
    id: typeof source['id'] === 'string' ? source['id'] : null,
    type: typeof source['type'] === 'string' ? source['type'] : null,
    hasText: rawText !== null,
    textPreview: sanitizedText,
    fromId:
      typeof source['from'] === 'object' &&
      source['from'] !== null &&
      typeof (source['from'] as Record<string, unknown>)['id'] === 'string'
        ? ((source['from'] as Record<string, unknown>)['id'] as string)
        : null,
    fromAadObjectId:
      typeof source['from'] === 'object' &&
      source['from'] !== null &&
      typeof (source['from'] as Record<string, unknown>)['aadObjectId'] === 'string'
        ? ((source['from'] as Record<string, unknown>)['aadObjectId'] as string)
        : null,
    channelId:
      typeof source['channelId'] === 'string'
        ? source['channelId']
        : typeof source['channelData'] === 'object' &&
              source['channelData'] !== null &&
              typeof (source['channelData'] as Record<string, unknown>)['channel'] === 'object' &&
              (source['channelData'] as Record<string, unknown>)['channel'] !== null &&
              typeof (
                (source['channelData'] as Record<string, unknown>)['channel'] as Record<string, unknown>
              )['id'] === 'string'
          ? (((source['channelData'] as Record<string, unknown>)['channel'] as Record<string, unknown>)[
              'id'
            ] as string)
          : null
  };
}

function logWebhookEvent(level: 'info' | 'warn' | 'error', message: string, details: Record<string, unknown>) {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger(message, details);
}

function verifyWebhookSignature(input: {
  signature: string;
  payload: unknown;
  secret: string;
}): boolean {
  const normalized = input.signature.startsWith('sha256=')
    ? input.signature.slice('sha256='.length)
    : input.signature;
  const expected = createHmac('sha256', input.secret)
    .update(JSON.stringify(input.payload))
    .digest('hex');

  if (normalized.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(normalized), Buffer.from(expected));
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function verifyBotBearerToken(authHeader: string | null, expectedAudience: string): boolean {
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return false;
  }

  const payloadJson = decodeBase64Url(parts[1]);
  if (!payloadJson) {
    return false;
  }

  try {
    const payload = JSON.parse(payloadJson) as {
      aud?: string;
      exp?: number;
      iss?: string;
    };
    if (payload.aud !== expectedAudience) {
      return false;
    }
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
      return false;
    }
    if (typeof payload.iss !== 'string' || payload.iss.length === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

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
      ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      ...(payload.userName ? { userName: payload.userName } : {}),
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
      attachments: normalizeAttachments(payload.attachments)
    };
  }

  const channelId = payload.channelData?.channel?.id ?? payload.conversation?.id ?? null;
  const userId = payload.from?.aadObjectId ?? payload.from?.id ?? null;
  const tenantId = payload.channelData?.tenant?.id ?? payload.conversation?.tenantId ?? null;
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
    ...(tenantId ? { tenantId } : {}),
    ...(payload.from?.name ? { userName: payload.from.name } : {}),
    ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
    attachments: normalizeAttachments(payload.attachments),
    ...(payload.value ? { submission: payload.value } : {})
  };
}

export const POST: RequestHandler = async (event) => {
  const orgId = event.request.headers.get('x-org-id') ?? getDefaultOrgId();
  const context = getRequestLogContext(event, orgId);
  const configuredBotAppId = getTeamsBotAppId();
  const configuredWebhookSecret = getTeamsWebhookSecret();
  const authorizationHeader = event.request.headers.get('authorization');
  const providedWebhookSignature = event.request.headers.get('x-haveri-webhook-signature');
  const providedWebhookSecret = event.request.headers.get('x-haveri-webhook-secret');

  try {
    if (
      configuredBotAppId &&
      !verifyBotBearerToken(authorizationHeader, configuredBotAppId)
    ) {
      logWebhookEvent('warn', 'Teams webhook rejected due to invalid bot authorization token', {
        ...context
      });
      return json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }

    const rawPayload = await readJson<unknown>(event.request);

    if (configuredWebhookSecret) {
      const hasValidSignature = providedWebhookSignature
        ? verifyWebhookSignature({
            signature: providedWebhookSignature,
            payload: rawPayload,
            secret: configuredWebhookSecret
          })
        : false;
      const hasValidSharedSecret = configuredWebhookSecret === providedWebhookSecret;

      if (!hasValidSignature && !hasValidSharedSecret) {
        logWebhookEvent('warn', 'Teams webhook rejected due to invalid secret/signature', {
          ...context
        });
        return json({ error: 'Unauthorized webhook request' }, { status: 401 });
      }
    }

    logWebhookEvent('info', 'Teams webhook request received', {
      ...context,
      payload: summarizePayload(rawPayload)
    });

    const payload = teamsWebhookPayloadSchema.parse(rawPayload);
    const inbound = toTeamsInbound(payload);

    const existing = await getIdempotentResponse(orgId, 'teams', inbound.id);
    if (existing) {
      logWebhookEvent('info', 'Teams webhook idempotent cache hit', {
        ...context,
        inboundId: inbound.id
      });
      return json(existing);
    }

    const response = await handleTeamsInbound(orgId, inbound);

    await storeIdempotentResponse({
      organizationId: orgId,
      platform: 'teams',
      idempotencyKey: inbound.id,
      responsePayload: response
    });

    logWebhookEvent('info', 'Teams webhook processed', {
      ...context,
      inboundId: inbound.id,
      channelId: inbound.channelId,
      userId: inbound.userId
    });

    return json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logWebhookEvent('warn', 'Teams webhook validation failed', {
        ...context,
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message
        }))
      });
      return json({ error: error.flatten() }, { status: 400 });
    }

    logWebhookEvent('error', 'Teams webhook failed', {
      ...context,
      error: error instanceof Error ? error.message : String(error)
    });

    return toErrorResponse(error);
  }
};
