import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetTeamsClientId = vi.hoisted(() => vi.fn());
const mockGetTeamsClientSecret = vi.hoisted(() => vi.fn());
const mockGetTeamsDelegatedAccessToken = vi.hoisted(() => vi.fn());
const mockGetTeamsGraphBaseUrlRoot = vi.hoisted(() => vi.fn());
const mockGetTeamsTenantId = vi.hoisted(() => vi.fn());
const mockTeamsGraphClientCtor = vi.hoisted(() =>
  vi.fn().mockImplementation(function MockTeamsGraphClient(options: unknown) {
    return { options };
  })
);

vi.mock('$lib/server/services/env', () => ({
  getTeamsClientId: mockGetTeamsClientId,
  getTeamsClientSecret: mockGetTeamsClientSecret,
  getTeamsDelegatedAccessToken: mockGetTeamsDelegatedAccessToken,
  getTeamsGraphBaseUrlRoot: mockGetTeamsGraphBaseUrlRoot,
  getTeamsTenantId: mockGetTeamsTenantId
}));

vi.mock('@microsoft/teams.graph', () => ({
  Client: mockTeamsGraphClientCtor
}));

import {
  createTeamsGraphClient,
  getTeamsGraphAccessToken,
  isTeamsGraphConfigured
} from './graph-client';

describe('teams graph-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeamsClientId.mockReturnValue('client-id');
    mockGetTeamsClientSecret.mockReturnValue('client-secret');
    mockGetTeamsTenantId.mockReturnValue('tenant-id');
    mockGetTeamsGraphBaseUrlRoot.mockReturnValue('https://graph.microsoft.com');
    mockGetTeamsDelegatedAccessToken.mockReturnValue(null);
  });

  it('treats delegated token as configured', () => {
    mockGetTeamsDelegatedAccessToken.mockReturnValue('delegated-token');

    expect(isTeamsGraphConfigured()).toBe(true);
  });

  it('treats client credentials as configured when delegated token is absent', () => {
    expect(isTeamsGraphConfigured()).toBe(true);
  });

  it('returns delegated token directly when present', async () => {
    mockGetTeamsDelegatedAccessToken.mockReturnValue('delegated-token');

    await expect(getTeamsGraphAccessToken()).resolves.toBe('delegated-token');
  });

  it('fetches and caches client-credentials token', async () => {
    mockGetTeamsTenantId.mockReturnValue('tenant-cache');
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'token-1', expires_in: 3600 })
      } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const tokenA = await getTeamsGraphAccessToken();
    const tokenB = await getTeamsGraphAccessToken();

    expect(tokenA).toBe('token-1');
    expect(tokenB).toBe('token-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('creates graph client with token callback and configured base url', async () => {
    mockGetTeamsDelegatedAccessToken.mockReturnValue('delegated-token');

    const client = createTeamsGraphClient() as unknown as {
      options: { baseUrlRoot: string; token: () => Promise<string> };
    };
    const token = await client.options.token();

    expect(mockTeamsGraphClientCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrlRoot: 'https://graph.microsoft.com'
      })
    );
    expect(token).toBe('delegated-token');
  });
});
