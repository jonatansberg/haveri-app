function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseDomainList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function mergeValidDomains(existing: string | undefined, host: string): string {
  const domains = parseDomainList(existing);
  const merged = Array.from(new Set([...domains, host]));
  return merged.join(', ');
}

export function normalizeHttpsBaseUrl(rawBaseUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawBaseUrl);
  } catch {
    throw new Error(`Invalid base URL: ${rawBaseUrl}`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`Base URL must use https: ${rawBaseUrl}`);
  }

  const normalized = parsed.toString().replace(/\/$/, '');
  return normalized;
}

export function readEnvValue(content: string, key: string): string | undefined {
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const envKey = line.slice(0, separator).trim();
    if (envKey !== key) {
      continue;
    }

    return stripQuotes(line.slice(separator + 1));
  }

  return undefined;
}

export function upsertEnvContent(content: string, updates: Record<string, string>): string {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.length > 0 ? content.split(/\r?\n/) : [];
  const updatedKeys = new Set<string>();
  const matchers = Object.keys(updates).map((key) => ({
    key,
    regex: new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`)
  }));

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (typeof line !== 'string') {
      continue;
    }

    const matcher = matchers.find((entry) => entry.regex.test(line));
    if (!matcher) {
      continue;
    }

    lines[index] = `${matcher.key}=${updates[matcher.key]}`;
    updatedKeys.add(matcher.key);
  }

  for (const key of Object.keys(updates)) {
    if (updatedKeys.has(key)) {
      continue;
    }

    lines.push(`${key}=${updates[key]}`);
  }

  const output = lines.join(eol);
  return output.endsWith(eol) ? output : `${output}${eol}`;
}

export function buildTeamsTunnelEnvUpdates(
  baseUrl: string,
  existingValidDomains: string | undefined
): Record<string, string> {
  const host = new URL(baseUrl).host;
  const validDomains = mergeValidDomains(existingValidDomains, host);

  return {
    TEAMS_APP_BASE_URL: baseUrl,
    TEAMS_APP_VALID_DOMAINS: validDomains,
    TEAMS_APP_DEVELOPER_WEBSITE_URL: baseUrl,
    TEAMS_APP_DEVELOPER_PRIVACY_URL: `${baseUrl}/privacy`,
    TEAMS_APP_DEVELOPER_TERMS_URL: `${baseUrl}/terms`
  };
}
