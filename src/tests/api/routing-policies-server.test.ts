import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockGetOrganizationId = vi.hoisted(() => vi.fn());
const mockReadJson = vi.hoisted(() => vi.fn());
const mockToErrorResponse = vi.hoisted(() => vi.fn());
const mockListRoutingPolicies = vi.hoisted(() => vi.fn());
const mockCreateRoutingPolicy = vi.hoisted(() => vi.fn());
const mockUpdateRoutingPolicy = vi.hoisted(() => vi.fn());
const mockDeleteRoutingPolicy = vi.hoisted(() => vi.fn());
const mockReorderRoutingPolicies = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/auth-utils', () => ({
  requireUser: mockRequireUser,
  getOrganizationId: mockGetOrganizationId
}));

vi.mock('$lib/server/api/http', () => ({
  readJson: mockReadJson,
  toErrorResponse: mockToErrorResponse
}));

vi.mock('$lib/server/services/routing-policy-service', () => ({
  listRoutingPolicies: mockListRoutingPolicies,
  createRoutingPolicy: mockCreateRoutingPolicy,
  updateRoutingPolicy: mockUpdateRoutingPolicy,
  deleteRoutingPolicy: mockDeleteRoutingPolicy,
  reorderRoutingPolicies: mockReorderRoutingPolicies
}));

import { GET, POST } from '../../routes/api/routing-policies/+server';
import { PATCH, DELETE } from '../../routes/api/routing-policies/[id]/+server';
import { POST as reorder } from '../../routes/api/routing-policies/reorder/+server';

describe('routing policy API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockReturnValue({ id: 'user-1' });
    mockGetOrganizationId.mockReturnValue('org-1');
    mockToErrorResponse.mockImplementation(() => new Response('error', { status: 500 }));
  });

  it('lists routing policies', async () => {
    mockListRoutingPolicies.mockResolvedValue([{ id: 'policy-1' }]);

    const response = await GET({
      request: new Request('http://localhost/api/routing-policies'),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ policies: [{ id: 'policy-1' }] });
    expect(mockListRoutingPolicies).toHaveBeenCalledWith('org-1');
  });

  it('creates routing policy and returns warnings', async () => {
    mockReadJson.mockResolvedValue({
      name: 'SEV1 daytime',
      facilityId: 'facility-1',
      conditions: { severity: ['SEV1'] },
      steps: [{ delayMinutes: 0, notifyType: 'team', notifyTargetIds: ['team-1'] }]
    });
    mockCreateRoutingPolicy.mockResolvedValue({
      policy: { id: 'policy-2' },
      warnings: ['duplicate condition warning']
    });

    const response = await POST({
      request: new Request('http://localhost/api/routing-policies', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      policy: { id: 'policy-2' },
      warnings: ['duplicate condition warning']
    });
    expect(mockCreateRoutingPolicy).toHaveBeenCalledWith({
      organizationId: 'org-1',
      name: 'SEV1 daytime',
      facilityId: 'facility-1',
      conditions: { severity: ['SEV1'] },
      steps: [{ delayMinutes: 0, notifyType: 'team', notifyTargetIds: ['team-1'] }]
    });
  });

  it('updates routing policies', async () => {
    mockReadJson.mockResolvedValue({
      name: 'Updated policy',
      isActive: false
    });
    mockUpdateRoutingPolicy.mockResolvedValue({
      policy: { id: 'policy-3', name: 'Updated policy' },
      warnings: []
    });

    const response = await PATCH({
      params: { id: 'policy-3' },
      request: new Request('http://localhost/api/routing-policies/policy-3', { method: 'PATCH' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof PATCH>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      policy: { id: 'policy-3', name: 'Updated policy' },
      warnings: []
    });
    expect(mockUpdateRoutingPolicy).toHaveBeenCalledWith({
      organizationId: 'org-1',
      policyId: 'policy-3',
      name: 'Updated policy',
      isActive: false
    });
  });

  it('deletes routing policy', async () => {
    const response = await DELETE({
      params: { id: 'policy-4' },
      request: new Request('http://localhost/api/routing-policies/policy-4', { method: 'DELETE' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof DELETE>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockDeleteRoutingPolicy).toHaveBeenCalledWith({
      organizationId: 'org-1',
      policyId: 'policy-4'
    });
  });

  it('reorders routing policies', async () => {
    mockReadJson.mockResolvedValue({ orderedPolicyIds: ['policy-2', 'policy-1'] });
    mockReorderRoutingPolicies.mockResolvedValue([{ id: 'policy-2' }, { id: 'policy-1' }]);

    const response = await reorder({
      request: new Request('http://localhost/api/routing-policies/reorder', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof reorder>[0]);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      policies: [{ id: 'policy-2' }, { id: 'policy-1' }]
    });
    expect(mockReorderRoutingPolicies).toHaveBeenCalledWith({
      organizationId: 'org-1',
      orderedPolicyIds: ['policy-2', 'policy-1']
    });
  });
});
