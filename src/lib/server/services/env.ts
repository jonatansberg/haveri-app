export function getDatabaseUrl(): string {
  const value = process.env['DATABASE_URL'];
  if (!value) {
    throw new Error('DATABASE_URL is required');
  }
  return value;
}

export function getDefaultOrgId(): string {
  return process.env['DEFAULT_ORG_ID'] ?? '00000000-0000-0000-0000-000000000001';
}

export function getRedisUrl(): string {
  return process.env['REDIS_URL'] ?? 'redis://localhost:6379';
}

export function getTeamsGlobalIncidentChannel(): string {
  return process.env['TEAMS_GLOBAL_INCIDENT_CHANNEL'] ?? 'haveri-incidents';
}

export function getTeamsIncidentChannelPrefix(): string {
  return process.env['TEAMS_INCIDENT_CHANNEL_PREFIX'] ?? 'incident';
}

export function getTeamsIncidentTeamId(): string | null {
  return process.env['TEAMS_INCIDENT_TEAM_ID'] ?? null;
}

export function getTeamsTenantId(): string | null {
  return process.env['TEAMS_TENANT_ID'] ?? null;
}

export function getTeamsClientId(): string | null {
  return process.env['TEAMS_CLIENT_ID'] ?? null;
}

export function getTeamsClientSecret(): string | null {
  return process.env['TEAMS_CLIENT_SECRET'] ?? null;
}

export function getTeamsGraphBaseUrlRoot(): string {
  return process.env['TEAMS_GRAPH_BASE_URL_ROOT'] ?? 'https://graph.microsoft.com';
}

export function getTeamsDelegatedAccessToken(): string | null {
  return process.env['TEAMS_DELEGATED_ACCESS_TOKEN'] ?? null;
}
