import { describe, expect, it } from 'vitest';
import {
  buildTeamsTunnelEnvUpdates,
  mergeValidDomains,
  normalizeHttpsBaseUrl,
  upsertEnvContent
} from './dev-tunnel';

describe('dev tunnel helpers', () => {
  it('normalizes https URLs and strips trailing slash', () => {
    expect(normalizeHttpsBaseUrl('https://teams-dev.example.com/')).toBe(
      'https://teams-dev.example.com'
    );
  });

  it('rejects non-https URLs', () => {
    expect(() => normalizeHttpsBaseUrl('http://teams-dev.example.com')).toThrow(
      /must use https/i
    );
  });

  it('merges valid domains without duplicates', () => {
    const merged = mergeValidDomains(
      'existing.example.com, teams-dev.example.com',
      'teams-dev.example.com'
    );

    expect(merged).toBe('existing.example.com, teams-dev.example.com');
  });

  it('upserts existing env keys and appends missing keys', () => {
    const input = ['TEAMS_APP_BASE_URL=https://old.example.com', 'TEAMS_APP_NAME_SHORT=Haveri'].join(
      '\n'
    );
    const output = upsertEnvContent(input, {
      TEAMS_APP_BASE_URL: 'https://new.example.com',
      TEAMS_APP_VALID_DOMAINS: 'new.example.com'
    });

    expect(output).toContain('TEAMS_APP_BASE_URL=https://new.example.com');
    expect(output).toContain('TEAMS_APP_VALID_DOMAINS=new.example.com');
    expect(output).toContain('TEAMS_APP_NAME_SHORT=Haveri');
  });

  it('builds teams env updates from base URL', () => {
    const updates = buildTeamsTunnelEnvUpdates(
      'https://teams-dev.example.com',
      'existing.example.com'
    );

    expect(updates['TEAMS_APP_BASE_URL']).toBe('https://teams-dev.example.com');
    expect(updates['TEAMS_APP_VALID_DOMAINS']).toBe('existing.example.com, teams-dev.example.com');
    expect(updates['TEAMS_APP_DEVELOPER_PRIVACY_URL']).toBe('https://teams-dev.example.com/privacy');
    expect(updates['TEAMS_APP_DEVELOPER_TERMS_URL']).toBe('https://teams-dev.example.com/terms');
  });
});
