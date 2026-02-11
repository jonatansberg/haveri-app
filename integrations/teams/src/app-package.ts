export interface TeamsAppPackageConfig {
  manifestId: string;
  botId: string;
  packageVersion: string;
  appNameShort: string;
  appNameFull: string;
  shortDescription: string;
  longDescription: string;
  developerName: string;
  developerWebsiteUrl: string;
  developerPrivacyUrl: string;
  developerTermsOfUseUrl: string;
  accentColor: string;
  baseUrl: string;
  validDomains: string[];
}

const DEFAULT_PACKAGE_VERSION = '1.0.0';
const DEFAULT_APP_NAME = 'Haveri';
const DEFAULT_SHORT_DESCRIPTION = 'Chat-native incident management for operations teams';
const DEFAULT_LONG_DESCRIPTION =
  'Haveri captures incident activity directly from Teams, coordinates ownership, and keeps a synchronized global incident announcement card.';

export interface TeamsManifestDeveloper {
  name: string;
  websiteUrl: string;
  privacyUrl: string;
  termsOfUseUrl: string;
}

export interface TeamsManifest {
  $schema: string;
  manifestVersion: string;
  version: string;
  id: string;
  developer: TeamsManifestDeveloper;
  name: {
    short: string;
    full: string;
  };
  description: {
    short: string;
    full: string;
  };
  icons: {
    color: string;
    outline: string;
  };
  accentColor: string;
  bots: {
    botId: string;
    scopes: string[];
    supportsFiles: boolean;
    isNotificationOnly: boolean;
    commandLists: {
      scopes: string[];
      commands: {
        title: string;
        description: string;
      }[];
    }[];
  }[];
  permissions: string[];
  validDomains: string[];
  webApplicationInfo: {
    id: string;
    resource: string;
  };
}

function parseValidDomains(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  const domains = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(domains));
}

function getHostFromBaseUrl(baseUrl: string): string | null {
  try {
    return new URL(baseUrl).host;
  } catch {
    return null;
  }
}

export function buildTeamsAppPackageConfigFromEnv(
  env: Record<string, string | undefined>
): TeamsAppPackageConfig {
  const manifestId = env['TEAMS_MANIFEST_APP_ID'] ?? env['TEAMS_APP_ID'] ?? env['TEAMS_CLIENT_ID'] ?? '';
  const botId = env['TEAMS_BOT_APP_ID'] ?? env['TEAMS_APP_ID'] ?? env['TEAMS_CLIENT_ID'] ?? '';
  const baseUrl = env['TEAMS_APP_BASE_URL'] ?? env['BETTER_AUTH_URL'] ?? '';

  const explicitDomains = parseValidDomains(env['TEAMS_APP_VALID_DOMAINS']);
  const hostFromBaseUrl = getHostFromBaseUrl(baseUrl);
  const validDomains = hostFromBaseUrl
    ? Array.from(new Set([...explicitDomains, hostFromBaseUrl]))
    : explicitDomains;

  return {
    manifestId,
    botId,
    packageVersion: env['TEAMS_APP_PACKAGE_VERSION'] ?? DEFAULT_PACKAGE_VERSION,
    appNameShort: env['TEAMS_APP_NAME_SHORT'] ?? DEFAULT_APP_NAME,
    appNameFull: env['TEAMS_APP_NAME_FULL'] ?? DEFAULT_APP_NAME,
    shortDescription: env['TEAMS_APP_DESCRIPTION_SHORT'] ?? DEFAULT_SHORT_DESCRIPTION,
    longDescription: env['TEAMS_APP_DESCRIPTION_LONG'] ?? DEFAULT_LONG_DESCRIPTION,
    developerName: env['TEAMS_APP_DEVELOPER_NAME'] ?? 'Haveri',
    developerWebsiteUrl: env['TEAMS_APP_DEVELOPER_WEBSITE_URL'] ?? baseUrl,
    developerPrivacyUrl: env['TEAMS_APP_DEVELOPER_PRIVACY_URL'] ?? `${baseUrl}/privacy`,
    developerTermsOfUseUrl: env['TEAMS_APP_DEVELOPER_TERMS_URL'] ?? `${baseUrl}/terms`,
    accentColor: env['TEAMS_APP_ACCENT_COLOR'] ?? '#0B6E4F',
    baseUrl,
    validDomains
  };
}

function isLikelyGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateTeamsAppPackageConfig(config: TeamsAppPackageConfig): string[] {
  const errors: string[] = [];

  if (!config.manifestId) {
    errors.push('TEAMS_MANIFEST_APP_ID (or TEAMS_APP_ID/TEAMS_CLIENT_ID fallback) is required');
  } else if (!isLikelyGuid(config.manifestId)) {
    errors.push('Manifest app id must be a GUID (TEAMS_MANIFEST_APP_ID)');
  }

  if (!config.botId) {
    errors.push('TEAMS_BOT_APP_ID (or TEAMS_APP_ID/TEAMS_CLIENT_ID fallback) is required');
  } else if (!isLikelyGuid(config.botId)) {
    errors.push('Bot app id must be a GUID (TEAMS_BOT_APP_ID)');
  }

  if (!config.baseUrl) {
    errors.push('TEAMS_APP_BASE_URL is required');
  } else {
    try {
      const parsed = new URL(config.baseUrl);
      if (parsed.protocol !== 'https:') {
        errors.push('TEAMS_APP_BASE_URL must use https');
      }
    } catch {
      errors.push('TEAMS_APP_BASE_URL must be a valid URL');
    }
  }

  if (config.shortDescription.length > 80) {
    errors.push('TEAMS_APP_DESCRIPTION_SHORT must be 80 characters or fewer');
  }

  if (config.longDescription.length > 4000) {
    errors.push('TEAMS_APP_DESCRIPTION_LONG must be 4000 characters or fewer');
  }

  if (config.validDomains.length === 0) {
    errors.push('At least one valid domain is required (TEAMS_APP_VALID_DOMAINS or host from TEAMS_APP_BASE_URL)');
  }

  return errors;
}

export function buildTeamsManifest(config: TeamsAppPackageConfig): TeamsManifest {
  return {
    $schema: 'https://developer.microsoft.com/json-schemas/teams/v1.17/MicrosoftTeams.schema.json',
    manifestVersion: '1.17',
    version: config.packageVersion,
    id: config.manifestId,
    developer: {
      name: config.developerName,
      websiteUrl: config.developerWebsiteUrl,
      privacyUrl: config.developerPrivacyUrl,
      termsOfUseUrl: config.developerTermsOfUseUrl
    },
    name: {
      short: config.appNameShort,
      full: config.appNameFull
    },
    description: {
      short: config.shortDescription,
      full: config.longDescription
    },
    icons: {
      color: 'color.png',
      outline: 'outline.png'
    },
    accentColor: config.accentColor,
    bots: [
      {
        botId: config.botId,
        scopes: ['team'],
        supportsFiles: false,
        isNotificationOnly: false,
        commandLists: [
          {
            scopes: ['team'],
            commands: [
              {
                title: '/incident',
                description: 'Declare a new incident and create workflow channel'
              },
              {
                title: '/status',
                description: 'Update incident status'
              },
              {
                title: '/resolve',
                description: 'Resolve incident and store summary'
              },
              {
                title: '/ack',
                description: 'Acknowledge escalation'
              }
            ]
          }
        ]
      }
    ],
    permissions: ['identity', 'messageTeamMembers'],
    validDomains: config.validDomains,
    webApplicationInfo: {
      id: config.botId,
      resource: config.baseUrl
    }
  };
}
