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
