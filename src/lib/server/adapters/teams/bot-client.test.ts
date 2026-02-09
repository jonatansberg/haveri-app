import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetTeamsBotClientId = vi.hoisted(() => vi.fn());
const mockGetTeamsBotClientSecret = vi.hoisted(() => vi.fn());
const mockGetTeamsBotServiceUrl = vi.hoisted(() => vi.fn());
const mockGetTeamsTenantId = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/services/env', () => ({
  getTeamsBotClientId: mockGetTeamsBotClientId,
  getTeamsBotClientSecret: mockGetTeamsBotClientSecret,
  getTeamsBotServiceUrl: mockGetTeamsBotServiceUrl,
  getTeamsTenantId: mockGetTeamsTenantId
}));

describe('teams bot-client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGetTeamsBotClientId.mockReturnValue('bot-app-id');
    mockGetTeamsBotClientSecret.mockReturnValue('bot-client-secret');
    mockGetTeamsBotServiceUrl.mockReturnValue('https://smba.trafficmanager.net/teams');
    mockGetTeamsTenantId.mockReturnValue('tenant-1');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports bot messaging configured only when all required values are present', async () => {
    const module = await import('./bot-client');
    expect(module.isTeamsBotMessagingConfigured()).toBe(true);

    mockGetTeamsBotClientSecret.mockReturnValue(null);
    expect(module.isTeamsBotMessagingConfigured()).toBe(false);
  });

  it('posts proactive adaptive cards via Bot Framework conversations API', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'bot-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'conversation-1', activityId: 'activity-1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );
    vi.stubGlobal('fetch', mockFetch);

    const module = await import('./bot-client');
    const posted = await module.postTeamsChannelCardViaBot({
      teamId: 'team-1',
      channelId: '19:channel@thread.tacv2',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(posted).toEqual({
      conversationId: 'conversation-1',
      activityId: 'activity-1',
      serviceUrl: 'https://smba.trafficmanager.net/teams'
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const postCall = mockFetch.mock.calls[1];
    expect(postCall?.[0]).toBe('https://smba.trafficmanager.net/teams/v3/conversations');
    expect(postCall?.[1]?.method).toBe('POST');
    expect(postCall?.[1]?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer bot-token'
      })
    );
  });

  it('updates proactive adaptive cards via Bot Framework conversation activities API', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'bot-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    const module = await import('./bot-client');
    await module.updateTeamsChannelCardViaBot({
      conversationId: 'conversation-1',
      activityId: 'activity-1',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const updateCall = mockFetch.mock.calls[1];
    expect(updateCall?.[0]).toBe(
      'https://smba.trafficmanager.net/teams/v3/conversations/conversation-1/activities/activity-1'
    );
    expect(updateCall?.[1]?.method).toBe('PUT');
    expect(updateCall?.[1]?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer bot-token'
      })
    );
  });
});
