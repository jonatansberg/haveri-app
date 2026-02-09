import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';

const mockReadJson = vi.hoisted(() => vi.fn());
const mockHandleTeamsInbound = vi.hoisted(() => vi.fn());
const mockGetDefaultOrgId = vi.hoisted(() => vi.fn());
const mockGetTeamsBotClientId = vi.hoisted(() => vi.fn());
const mockGetTeamsWebhookSecret = vi.hoisted(() => vi.fn());
const mockGetIdempotentResponse = vi.hoisted(() => vi.fn());
const mockStoreIdempotentResponse = vi.hoisted(() => vi.fn());
const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockCreateRemoteJWKSet = vi.hoisted(() => vi.fn(() => Symbol('jwks')));

vi.mock('$lib/server/api/http', async () => {
  const actual = await vi.importActual<typeof import('$lib/server/api/http')>('$lib/server/api/http');
  return {
    ...actual,
    readJson: mockReadJson
  };
});

vi.mock('$lib/server/adapters/teams/adapter', () => ({
  handleTeamsInbound: mockHandleTeamsInbound
}));

vi.mock('$lib/server/services/env', () => ({
  getDefaultOrgId: mockGetDefaultOrgId,
  getTeamsBotClientId: mockGetTeamsBotClientId,
  getTeamsWebhookSecret: mockGetTeamsWebhookSecret
}));

vi.mock('$lib/server/services/idempotency-service', () => ({
  getIdempotentResponse: mockGetIdempotentResponse,
  storeIdempotentResponse: mockStoreIdempotentResponse
}));

vi.mock('jose', () => ({
  jwtVerify: mockJwtVerify,
  createRemoteJWKSet: mockCreateRemoteJWKSet
}));

import { POST } from '../../routes/api/chat/teams/webhook/+server';

describe('POST /api/chat/teams/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDefaultOrgId.mockReturnValue('org-default');
    mockGetTeamsBotClientId.mockReturnValue(null);
    mockGetTeamsWebhookSecret.mockReturnValue(null);
    mockGetIdempotentResponse.mockResolvedValue(null);
    mockHandleTeamsInbound.mockResolvedValue({ ok: true, action: 'handled' });
    mockJwtVerify.mockResolvedValue({ payload: {} });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            issuer: 'https://api.botframework.com',
            jwks_uri: 'https://login.botframework.com/v1/.well-known/keys'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 401 when webhook secret is configured and header is missing', async () => {
    mockGetTeamsWebhookSecret.mockReturnValue('shared-secret');
    mockReadJson.mockResolvedValue({
      id: 'evt-auth',
      type: 'message',
      text: 'hello',
      channelId: '19:channel@thread.tacv2',
      userId: 'user-1'
    });

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', { method: 'POST' })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized webhook request'
    });
    expect(mockHandleTeamsInbound).not.toHaveBeenCalled();
  });

  it('returns 401 when bot app id is configured and auth bearer token is missing', async () => {
    mockGetTeamsBotClientId.mockReturnValue('bot-app-id');
    mockReadJson.mockResolvedValue({
      id: 'evt-auth-token',
      type: 'message',
      text: 'hello',
      channelId: '19:channel@thread.tacv2',
      userId: 'user-1'
    });

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', { method: 'POST' })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized webhook request'
    });
    expect(mockHandleTeamsInbound).not.toHaveBeenCalled();
  });

  it('accepts bearer token with matching audience and future expiration', async () => {
    const payload = {
      id: 'evt-auth-jwt',
      type: 'message',
      text: 'hello',
      channelId: '19:channel@thread.tacv2',
      userId: 'user-1'
    };
    const fakeToken = 'header.payload.signature';
    mockGetTeamsBotClientId.mockReturnValue('bot-app-id');
    mockReadJson.mockResolvedValue(payload);

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', {
        method: 'POST',
        headers: { authorization: `Bearer ${fakeToken}` }
      })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    expect(mockHandleTeamsInbound).toHaveBeenCalledTimes(1);
    expect(mockJwtVerify).toHaveBeenCalledTimes(1);
  });

  it('accepts webhook requests signed with the shared secret', async () => {
    const payload = {
      id: 'evt-auth-signature',
      type: 'message',
      text: 'hello',
      channelId: '19:channel@thread.tacv2',
      userId: 'user-1'
    };
    mockGetTeamsWebhookSecret.mockReturnValue('shared-secret');
    mockReadJson.mockResolvedValue(payload);

    const signature = createHmac('sha256', 'shared-secret')
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', {
        method: 'POST',
        headers: { 'x-haveri-webhook-signature': `sha256=${signature}` }
      })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    expect(mockHandleTeamsInbound).toHaveBeenCalledTimes(1);
  });

  it('accepts legacy webhook payload shape', async () => {
    mockReadJson.mockResolvedValue({
      id: 'evt-1',
      type: 'message',
      text: '/incident SEV1 Conveyor stopped',
      channelId: '19:channel@thread.tacv2',
      userId: 'user-1',
      userName: 'Alex',
      tenantId: 'tenant-legacy-1'
    });

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', {
        method: 'POST',
        headers: { 'x-org-id': 'org-1' }
      })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    expect(mockHandleTeamsInbound).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({
        id: 'evt-1',
        text: '/incident SEV1 Conveyor stopped',
        channelId: '19:channel@thread.tacv2',
        userId: 'user-1',
        tenantId: 'tenant-legacy-1'
      })
    );
    expect(mockStoreIdempotentResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        platform: 'teams',
        idempotencyKey: 'evt-1'
      })
    );
  });

  it('returns cached idempotent response when event has already been processed', async () => {
    mockReadJson.mockResolvedValue({
      id: 'evt-2',
      type: 'message',
      text: 'ignored',
      channelId: '19:channel@thread.tacv2',
      userId: 'user-2'
    });
    mockGetIdempotentResponse.mockResolvedValue({ ok: true, action: 'cached' });

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', { method: 'POST' })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, action: 'cached' });
    expect(mockHandleTeamsInbound).not.toHaveBeenCalled();
    expect(mockStoreIdempotentResponse).not.toHaveBeenCalled();
  });

  it('normalizes Bot/Teams activity payload shape', async () => {
    mockReadJson.mockResolvedValue({
      id: 'evt-3',
      type: 'message',
      text: '<at>Haveri</at>&nbsp;/status inc-22 MITIGATED',
      from: {
        id: '29:bot-user-id',
        aadObjectId: 'aad-user-1',
        name: 'Operator'
      },
      conversation: {
        id: '19:conversation@thread.tacv2'
      },
      channelData: {
        channel: {
          id: '19:channel@thread.tacv2'
        },
        tenant: {
          id: 'tenant-activity-1'
        }
      },
      attachments: [
        {
          name: 'report.pdf',
          contentType: 'application/pdf',
          contentUrl: 'https://files.example/report.pdf'
        }
      ],
      timestamp: '2026-02-07T10:00:00.000Z'
    });

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', { method: 'POST' })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    expect(mockHandleTeamsInbound).toHaveBeenCalledWith(
      'org-default',
      expect.objectContaining({
        id: 'evt-3',
        text: '/status inc-22 MITIGATED',
        channelId: '19:channel@thread.tacv2',
        userId: 'aad-user-1',
        tenantId: 'tenant-activity-1',
        userName: 'Operator',
        timestamp: '2026-02-07T10:00:00.000Z',
        attachments: [
          {
            name: 'report.pdf',
            contentType: 'application/pdf',
            contentUrl: 'https://files.example/report.pdf'
          }
        ]
      })
    );
  });

  it('ignores non-message Teams activity payloads', async () => {
    mockReadJson.mockResolvedValue({
      id: 'evt-3b',
      type: 'conversationUpdate',
      from: {
        id: '28:app:bot-id'
      },
      conversation: {
        id: '19:conversation@thread.tacv2'
      },
      channelData: {
        channel: {
          id: '19:channel@thread.tacv2'
        }
      }
    });

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', { method: 'POST' })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      action: 'ignored',
      reason: 'unsupported_activity_type',
      activityType: 'conversationUpdate'
    });
    expect(mockHandleTeamsInbound).not.toHaveBeenCalled();
    expect(mockStoreIdempotentResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-default',
        platform: 'teams',
        idempotencyKey: 'evt-3b'
      })
    );
    expect(mockStoreIdempotentResponse.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        responsePayload: {
          ok: true,
          action: 'ignored',
          reason: 'unsupported_activity_type',
          activityType: 'conversationUpdate'
        }
      })
    );
  });

  it('returns 400 when activity payload is missing channel id', async () => {
    mockReadJson.mockResolvedValue({
      id: 'evt-4',
      type: 'message',
      text: 'hello',
      from: {
        id: '29:user'
      }
    });

    const response = await POST({
      request: new Request('http://localhost/api/chat/teams/webhook', { method: 'POST' })
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Teams activity payload is missing channel reference'
    });
  });
});
