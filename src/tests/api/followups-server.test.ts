import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockGetOrganizationId = vi.hoisted(() => vi.fn());
const mockReadJson = vi.hoisted(() => vi.fn());
const mockToErrorResponse = vi.hoisted(() => vi.fn());
const mockListFollowUps = vi.hoisted(() => vi.fn());
const mockUpdateFollowUpStatus = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/auth-utils', () => ({
  requireUser: mockRequireUser,
  getOrganizationId: mockGetOrganizationId
}));

vi.mock('$lib/server/api/http', () => ({
  readJson: mockReadJson,
  toErrorResponse: mockToErrorResponse
}));

vi.mock('$lib/server/services/follow-up-service', () => ({
  listFollowUps: mockListFollowUps,
  updateFollowUpStatus: mockUpdateFollowUpStatus
}));

import { GET, PATCH } from '../../routes/api/followups/+server';

describe('followups API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockReturnValue({ id: 'user-1' });
    mockGetOrganizationId.mockReturnValue('org-1');
    mockToErrorResponse.mockImplementation(() => new Response('error', { status: 500 }));
  });

  it('lists followups with no filters', async () => {
    mockListFollowUps.mockResolvedValue([]);

    const response = await GET({
      request: new Request('http://localhost/api/followups'),
      url: new URL('http://localhost/api/followups'),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(mockListFollowUps).toHaveBeenCalledWith({ organizationId: 'org-1' });
  });

  it('passes query filters to follow-up service', async () => {
    mockListFollowUps.mockResolvedValue([]);

    const response = await GET({
      request: new Request(
        'http://localhost/api/followups?incidentId=inc-1&status=OPEN&assignedToMemberId=m-1&facilityId=f-1&overdue=true'
      ),
      url: new URL(
        'http://localhost/api/followups?incidentId=inc-1&status=OPEN&assignedToMemberId=m-1&facilityId=f-1&overdue=true'
      ),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(mockListFollowUps).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      status: 'OPEN',
      assignedToMemberId: 'm-1',
      facilityId: 'f-1',
      overdue: true
    });
  });

  it('updates follow-up status', async () => {
    mockReadJson.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'DONE'
    });

    const response = await PATCH({
      request: new Request('http://localhost/api/followups', { method: 'PATCH' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof PATCH>[0]);

    expect(response.status).toBe(200);
    expect(mockUpdateFollowUpStatus).toHaveBeenCalledWith({
      organizationId: 'org-1',
      followUpId: '11111111-1111-4111-8111-111111111111',
      status: 'DONE'
    });
  });
});
