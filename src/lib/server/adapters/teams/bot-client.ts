import {
  getTeamsBotClientId,
  getTeamsBotClientSecret,
  getTeamsBotServiceUrl,
  getTeamsTenantId
} from '$lib/server/services/env';
import { ValidationError } from '$lib/server/services/errors';

const BOT_CONNECTOR_SCOPE = 'https://api.botframework.com/.default';
const ADAPTIVE_CARD_CONTENT_TYPE = 'application/vnd.microsoft.card.adaptive';

interface CachedConnectorToken {
  accessToken: string;
  expiresAt: number;
}

interface ConnectorTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

let cachedConnectorToken: CachedConnectorToken | null = null;

function getBotConnectorTokenUrl(tenantId: string): string {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
}

function normalizeServiceUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function getBotMessagingConfiguration(): {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  serviceUrl: string;
} {
  const clientId = getTeamsBotClientId();
  const clientSecret = getTeamsBotClientSecret();
  const tenantId = getTeamsTenantId();
  const serviceUrl = normalizeServiceUrl(getTeamsBotServiceUrl());

  if (!clientId || !clientSecret || !tenantId) {
    throw new ValidationError(
      'Teams bot messaging is not fully configured. Set TEAMS_BOT_APP_ID (or TEAMS_CLIENT_ID), TEAMS_BOT_CLIENT_SECRET (or TEAMS_CLIENT_SECRET), and TEAMS_TENANT_ID.'
    );
  }

  return {
    clientId,
    clientSecret,
    tenantId,
    serviceUrl
  };
}

export function isTeamsBotMessagingConfigured(): boolean {
  return Boolean(getTeamsBotClientId() && getTeamsBotClientSecret() && getTeamsTenantId());
}

async function getBotConnectorAccessToken(): Promise<string> {
  const config = getBotMessagingConfiguration();
  if (cachedConnectorToken && cachedConnectorToken.expiresAt > Date.now() + 60_000) {
    return cachedConnectorToken.accessToken;
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
    scope: BOT_CONNECTOR_SCOPE
  });

  const response = await fetch(getBotConnectorTokenUrl(config.tenantId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const payload = (await response.json()) as ConnectorTokenResponse;
  if (!response.ok || !payload.access_token || !payload.expires_in) {
    throw new ValidationError(
      `Failed to acquire Teams bot connector token (${response.status}): ${payload.error_description ?? payload.error ?? 'unknown error'}`
    );
  }

  cachedConnectorToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000
  };

  return payload.access_token;
}

function buildCardMessageActivity(card: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'message',
    summary: 'Haveri incident update',
    attachments: [
      {
        contentType: ADAPTIVE_CARD_CONTENT_TYPE,
        content: card
      }
    ]
  };
}

export async function postTeamsChannelCardViaBot(input: {
  teamId: string;
  channelId: string;
  card: Record<string, unknown>;
}): Promise<{ conversationId: string; activityId: string; serviceUrl: string }> {
  const config = getBotMessagingConfiguration();
  const token = await getBotConnectorAccessToken();
  const response = await fetch(`${config.serviceUrl}/v3/conversations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isGroup: true,
      bot: {
        id: config.clientId
      },
      channelData: {
        channel: {
          id: input.channelId
        },
        team: {
          id: input.teamId
        },
        tenant: {
          id: config.tenantId
        }
      },
      activity: buildCardMessageActivity(input.card)
    })
  });

  const rawBody = await response.text();
  const payload = parseJsonObject(rawBody);
  if (!response.ok) {
    const detail =
      typeof payload?.['message'] === 'string'
        ? payload['message']
        : typeof payload?.['error'] === 'string'
          ? payload['error']
          : null;
    throw new ValidationError(
      `Unable to post Teams bot message (${response.status})${detail ? `: ${detail}` : ''}`
    );
  }

  const conversationId = typeof payload?.['id'] === 'string' ? payload['id'] : null;
  const activityId = typeof payload?.['activityId'] === 'string' ? payload['activityId'] : null;
  if (!conversationId || !activityId) {
    throw new ValidationError(
      'Teams bot conversation creation succeeded but conversation/activity identifiers were missing'
    );
  }

  return {
    conversationId,
    activityId,
    serviceUrl: config.serviceUrl
  };
}

export async function updateTeamsChannelCardViaBot(input: {
  conversationId: string;
  activityId: string;
  card: Record<string, unknown>;
  serviceUrl?: string;
}): Promise<void> {
  const token = await getBotConnectorAccessToken();
  const fallbackServiceUrl = normalizeServiceUrl(getTeamsBotServiceUrl());
  const serviceUrl = normalizeServiceUrl(input.serviceUrl ?? fallbackServiceUrl);
  const response = await fetch(
    `${serviceUrl}/v3/conversations/${encodeURIComponent(input.conversationId)}/activities/${encodeURIComponent(input.activityId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...buildCardMessageActivity(input.card),
        id: input.activityId
      })
    }
  );

  if (!response.ok) {
    const rawBody = await response.text();
    const payload = parseJsonObject(rawBody);
    const detail =
      typeof payload?.['message'] === 'string'
        ? payload['message']
        : typeof payload?.['error'] === 'string'
          ? payload['error']
          : null;
    throw new ValidationError(
      `Unable to update Teams bot message (${response.status})${detail ? `: ${detail}` : ''}`
    );
  }
}
