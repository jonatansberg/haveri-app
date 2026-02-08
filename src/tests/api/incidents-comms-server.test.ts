import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockGetOrganizationId = vi.hoisted(() => vi.fn());
const mockReadJson = vi.hoisted(() => vi.fn());
const mockToErrorResponse = vi.hoisted(() => vi.fn());
const mockSyncGlobalIncidentAnnouncement = vi.hoisted(() => vi.fn());
const mockIncidentService = vi.hoisted(() => ({
  assignCommsLead: vi.fn()
}));

vi.mock('$lib/server/auth-utils', () => ({
  requireUser: mockRequireUser,
  getOrganizationId: mockGetOrganizationId
}));

vi.mock('$lib/server/api/http', () => ({
  readJson: mockReadJson,
  toErrorResponse: mockToErrorResponse
}));

vi.mock('$lib/server/services/incident-workflow-service', () => ({
  syncGlobalIncidentAnnouncement: mockSyncGlobalIncidentAnnouncement
}));

vi.mock('$lib/server/services/incident-service', () => ({
  incidentService: mockIncidentService
}));

import { POST } from '../../routes/api/incidents/[id]/comms/+server';

describe('POST /api/incidents/:id/comms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockReturnValue({ id: 'user-1' });
    mockGetOrganizationId.mockReturnValue('org-1');
    mockToErrorResponse.mockImplementation(() => new Response('error', { status: 500 }));
  });

  it('assigns a comms lead and syncs global announcement', async () => {
    mockReadJson.mockResolvedValue({
      memberId: '11111111-1111-4111-8111-111111111111'
    });

    const response = await POST({
      params: { id: 'inc-1' },
      request: new Request('http://localhost/api/incidents/inc-1/comms', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockIncidentService.assignCommsLead).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      memberId: '11111111-1111-4111-8111-111111111111'
    });
    expect(mockSyncGlobalIncidentAnnouncement).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });
  });

  it('returns 400 for invalid memberId payload', async () => {
    mockReadJson.mockResolvedValue({ memberId: 'bad' });

    const response = await POST({
      params: { id: 'inc-1' },
      request: new Request('http://localhost/api/incidents/inc-1/comms', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: unknown };
    expect(body.error).toBeDefined();
  });
});
