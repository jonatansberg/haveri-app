type EnvironmentMap = Record<string, string | undefined>;

let svelteEnv: EnvironmentMap | null = null;

void import('$env/dynamic/private')
  .then((module) => {
    svelteEnv = module.env as EnvironmentMap;
  })
  .catch(() => {
    svelteEnv = null;
  });

function readEnv(key: string): string | undefined {
  return svelteEnv?.[key] ?? process.env[key];
}

export function getDatabaseUrl(): string {
  const value = readEnv('DATABASE_URL');
  if (!value) {
    throw new Error('DATABASE_URL is required');
  }
  return value;
}

export function getDefaultOrgId(): string {
  return readEnv('DEFAULT_ORG_ID') ?? '00000000-0000-0000-0000-000000000001';
}

export function getRedisUrl(): string {
  return readEnv('REDIS_URL') ?? 'redis://localhost:6379';
}

export function getTeamsGlobalIncidentChannel(): string {
  return readEnv('TEAMS_GLOBAL_INCIDENT_CHANNEL') ?? 'haveri-incidents';
}

export function getTeamsIncidentChannelPrefix(): string {
  return readEnv('TEAMS_INCIDENT_CHANNEL_PREFIX') ?? 'incident';
}

export function getTeamsIncidentTeamId(): string | null {
  return readEnv('TEAMS_INCIDENT_TEAM_ID') ?? null;
}

export function getTeamsTenantId(): string | null {
  return readEnv('TEAMS_TENANT_ID') ?? null;
}

export function getTeamsClientId(): string | null {
  return readEnv('TEAMS_CLIENT_ID') ?? null;
}

export function getTeamsClientSecret(): string | null {
  return readEnv('TEAMS_CLIENT_SECRET') ?? null;
}

export function getTeamsGraphBaseUrlRoot(): string {
  return readEnv('TEAMS_GRAPH_BASE_URL_ROOT') ?? 'https://graph.microsoft.com';
}

export function getTeamsDelegatedAccessToken(): string | null {
  return readEnv('TEAMS_DELEGATED_ACCESS_TOKEN') ?? null;
}

export function getTeamsWebhookSecret(): string | null {
  return readEnv('TEAMS_WEBHOOK_SECRET') ?? null;
}
