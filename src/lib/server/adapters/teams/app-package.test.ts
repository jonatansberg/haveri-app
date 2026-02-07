import { describe, expect, it } from 'vitest';
import {
  buildTeamsAppPackageConfigFromEnv,
  buildTeamsManifest,
  validateTeamsAppPackageConfig
} from './app-package';

describe('teams app-package', () => {
  it('builds config from env and derives host for valid domains', () => {
    const config = buildTeamsAppPackageConfigFromEnv({
      TEAMS_MANIFEST_APP_ID: '11111111-1111-4111-8111-111111111111',
      TEAMS_BOT_APP_ID: '22222222-2222-4222-8222-222222222222',
      TEAMS_APP_BASE_URL: 'https://haveri-dev.ngrok-free.app',
      TEAMS_APP_VALID_DOMAINS: 'haveri.internal, haveri-dev.ngrok-free.app',
      TEAMS_APP_NAME_SHORT: 'Haveri Dev'
    });

    expect(config.manifestId).toBe('11111111-1111-4111-8111-111111111111');
    expect(config.botId).toBe('22222222-2222-4222-8222-222222222222');
    expect(config.appNameShort).toBe('Haveri Dev');
    expect(config.validDomains).toEqual(['haveri.internal', 'haveri-dev.ngrok-free.app']);
  });

  it('uses fallback app ids and defaults when explicit vars are absent', () => {
    const config = buildTeamsAppPackageConfigFromEnv({
      TEAMS_CLIENT_ID: '33333333-3333-4333-8333-333333333333',
      TEAMS_APP_BASE_URL: 'https://haveri.example.com'
    });

    expect(config.manifestId).toBe('33333333-3333-4333-8333-333333333333');
    expect(config.botId).toBe('33333333-3333-4333-8333-333333333333');
    expect(config.packageVersion).toBe('1.0.0');
    expect(config.validDomains).toEqual(['haveri.example.com']);
  });

  it('returns validation errors for missing or malformed required config', () => {
    const errors = validateTeamsAppPackageConfig({
      manifestId: 'bad',
      botId: '',
      packageVersion: '1.0.0',
      appNameShort: 'Haveri',
      appNameFull: 'Haveri',
      shortDescription:
        'This short description is intentionally written to be way too long for Teams and should fail validation in tests.',
      longDescription: 'ok',
      developerName: 'Haveri',
      developerWebsiteUrl: 'http://example.com',
      developerPrivacyUrl: 'http://example.com/privacy',
      developerTermsOfUseUrl: 'http://example.com/terms',
      accentColor: '#0B6E4F',
      baseUrl: 'http://example.com',
      validDomains: []
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'Manifest app id must be a GUID (TEAMS_MANIFEST_APP_ID)',
        'TEAMS_BOT_APP_ID (or TEAMS_APP_ID/TEAMS_CLIENT_ID fallback) is required',
        'TEAMS_APP_BASE_URL must use https',
        'TEAMS_APP_DESCRIPTION_SHORT must be 80 characters or fewer',
        'At least one valid domain is required (TEAMS_APP_VALID_DOMAINS or host from TEAMS_APP_BASE_URL)'
      ])
    );
  });

  it('builds Teams manifest with expected command list and bot scope', () => {
    const manifest = buildTeamsManifest({
      manifestId: '11111111-1111-4111-8111-111111111111',
      botId: '22222222-2222-4222-8222-222222222222',
      packageVersion: '1.2.3',
      appNameShort: 'Haveri',
      appNameFull: 'Haveri Incident Management',
      shortDescription: 'Chat-native incident management',
      longDescription: 'A long description for Haveri.',
      developerName: 'Haveri',
      developerWebsiteUrl: 'https://haveri.app',
      developerPrivacyUrl: 'https://haveri.app/privacy',
      developerTermsOfUseUrl: 'https://haveri.app/terms',
      accentColor: '#0B6E4F',
      baseUrl: 'https://haveri.app',
      validDomains: ['haveri.app']
    });

    expect(manifest.$schema).toContain('/v1.17/');
    expect(manifest.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(manifest.bots[0]?.scopes).toEqual(['team']);
    expect(manifest.bots[0]?.commandLists[0]?.commands.map((command) => command.title)).toEqual([
      '/incident',
      '/status',
      '/resolve',
      '/ack'
    ]);
    expect(manifest.validDomains).toEqual(['haveri.app']);
    expect(manifest.webApplicationInfo.resource).toBe('https://haveri.app');
  });
});
