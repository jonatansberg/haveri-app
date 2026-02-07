import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockReadJson = vi.hoisted(() => vi.fn());
const mockHandleTeamsInbound = vi.hoisted(() => vi.fn());
const mockGetDefaultOrgId = vi.hoisted(() => vi.fn());
const mockGetIdempotentResponse = vi.hoisted(() => vi.fn());
const mockStoreIdempotentResponse = vi.hoisted(() => vi.fn());

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
  getDefaultOrgId: mockGetDefaultOrgId
}));

vi.mock('$lib/server/services/idempotency-service', () => ({
  getIdempotentResponse: mockGetIdempotentResponse,
  storeIdempotentResponse: mockStoreIdempotentResponse
}));

import { POST } from '../../routes/api/chat/teams/webhook/+server';

describe('POST /api/chat/teams/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDefaultOrgId.mockReturnValue('org-default');
    mockGetIdempotentResponse.mockResolvedValue(null);
    mockHandleTeamsInbound.mockResolvedValue({ ok: true, action: 'handled' });
  });

  it('accepts legacy webhook payload shape', async () => {
    mockReadJson.mockResolvedValue({
      id: 'evt-1',
      type: 'message',
      text: '/incident SEV1 Conveyor stopped',
      channelId: '19:channel@thread.tacv2',
      userId: 'user-1',
      userName: 'Alex'
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
        userId: 'user-1'
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
        }
      },
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
        userName: 'Operator',
        timestamp: '2026-02-07T10:00:00.000Z'
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
