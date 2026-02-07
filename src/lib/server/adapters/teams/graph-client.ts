import { Client as TeamsGraphClient } from '@microsoft/teams.graph';
import {
  getTeamsClientId,
  getTeamsClientSecret,
  getTeamsDelegatedAccessToken,
  getTeamsGraphBaseUrlRoot,
  getTeamsTenantId
} from '$lib/server/services/env';
import { ValidationError } from '$lib/server/services/errors';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const tokenCacheByTenant = new Map<string, CachedToken>();

interface OAuthTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

function getTenantConfiguration(): {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  graphBaseUrlRoot: string;
} {
  const tenantId = getTeamsTenantId();
  const clientId = getTeamsClientId();
  const clientSecret = getTeamsClientSecret();
  const graphBaseUrlRoot = getTeamsGraphBaseUrlRoot();

  if (!tenantId || !clientId || !clientSecret) {
    throw new ValidationError(
      'Teams Graph is not fully configured. Set TEAMS_TENANT_ID, TEAMS_CLIENT_ID, and TEAMS_CLIENT_SECRET.'
    );
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    graphBaseUrlRoot
  };
}

function getGraphScope(baseUrlRoot: string): string {
  const origin = new URL(baseUrlRoot).origin;
  return `${origin}/.default`;
}

async function fetchClientCredentialsAccessToken(): Promise<string> {
  const { tenantId, clientId, clientSecret, graphBaseUrlRoot } = getTenantConfiguration();
  const cached = tokenCacheByTenant.get(tenantId);

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: getGraphScope(graphBaseUrlRoot)
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const tokenBody = (await response.json()) as OAuthTokenResponse;
  if (!response.ok || !tokenBody.access_token || !tokenBody.expires_in) {
    throw new ValidationError(
      `Failed to acquire Teams Graph token (${response.status}): ${tokenBody.error_description ?? tokenBody.error ?? 'unknown error'}`
    );
  }

  tokenCacheByTenant.set(tenantId, {
    accessToken: tokenBody.access_token,
    expiresAt: Date.now() + tokenBody.expires_in * 1000
  });

  return tokenBody.access_token;
}

export function isTeamsGraphConfigured(): boolean {
  const delegatedToken = getTeamsDelegatedAccessToken();
  if (delegatedToken) {
    return true;
  }

  return Boolean(getTeamsTenantId() && getTeamsClientId() && getTeamsClientSecret());
}

export async function getTeamsGraphAccessToken(): Promise<string> {
  const delegatedToken = getTeamsDelegatedAccessToken();
  if (delegatedToken) {
    return delegatedToken;
  }

  return fetchClientCredentialsAccessToken();
}

export function createTeamsGraphClient(): TeamsGraphClient {
  return new TeamsGraphClient({
    baseUrlRoot: getTeamsGraphBaseUrlRoot(),
    token: async () => getTeamsGraphAccessToken()
  });
}
