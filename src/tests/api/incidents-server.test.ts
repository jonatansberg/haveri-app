import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockGetOrganizationId = vi.hoisted(() => vi.fn());
const mockReadJson = vi.hoisted(() => vi.fn());
const mockToErrorResponse = vi.hoisted(() => vi.fn());
const mockListIncidents = vi.hoisted(() => vi.fn());
const mockDeclareIncidentWithWorkflow = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/auth-utils', () => ({
  requireUser: mockRequireUser,
  getOrganizationId: mockGetOrganizationId
}));

vi.mock('$lib/server/api/http', () => ({
  readJson: mockReadJson,
  toErrorResponse: mockToErrorResponse
}));

vi.mock('$lib/server/services/incident-queries', () => ({
  listIncidents: mockListIncidents
}));

vi.mock('$lib/server/services/incident-workflow-service', () => ({
  declareIncidentWithWorkflow: mockDeclareIncidentWithWorkflow
}));

import { GET, POST } from '../../routes/api/incidents/+server';

describe('POST /api/incidents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockReturnValue({ id: 'user-1' });
    mockGetOrganizationId.mockReturnValue('org-1');
    mockToErrorResponse.mockImplementation(() => new Response('error', { status: 500 }));
  });

  it('lists incidents for authenticated users', async () => {
    mockListIncidents.mockResolvedValue([
      {
        id: 'inc-1',
        title: 'Conveyor down',
        status: 'DECLARED',
        severity: 'SEV1',
        declaredAt: '2026-02-06T22:00:00.000Z',
        facilityName: 'Plant North',
        areaName: null,
        responsibleLead: 'Alex Rivera',
        commsLead: 'Sara Kim'
      }
    ]);

    const response = await GET({
      request: new Request('http://localhost/api/incidents'),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      incidents: { id: string; title: string }[];
    };
    expect(body.incidents).toHaveLength(1);
    expect(body.incidents[0]?.id).toBe('inc-1');
    expect(body.incidents[0]?.title).toBe('Conveyor down');
    expect(mockListIncidents).toHaveBeenCalledWith('org-1');
  });

  it('declares incidents through workflow service when payload is valid', async () => {
    mockReadJson.mockResolvedValue({
      title: 'Conveyor down',
      severity: 'SEV1',
      facilityId: '11111111-1111-4111-8111-111111111111',
      assignedToMemberId: '22222222-2222-4222-8222-222222222222',
      commsLeadMemberId: '33333333-3333-4333-8333-333333333333',
      chatPlatform: 'teams',
      sourceChannelRef: 'teams:source:1',
      tags: ['line-down']
    });
    mockDeclareIncidentWithWorkflow.mockResolvedValue({
      incidentId: 'inc-22',
      channelRef: 'teams:channel:inc-22',
      globalChannelRef: 'teams:global:haveri'
    });

    const response = await POST({
      request: new Request('http://localhost/api/incidents', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      incidentId: 'inc-22',
      channelRef: 'teams:channel:inc-22'
    });
    expect(mockDeclareIncidentWithWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        title: 'Conveyor down',
        severity: 'SEV1',
        responsibleLeadMemberId: '22222222-2222-4222-8222-222222222222',
        commsLeadMemberId: '33333333-3333-4333-8333-333333333333',
        actorExternalId: 'user-1'
      })
    );
  });

  it('returns 400 when payload validation fails', async () => {
    mockReadJson.mockResolvedValue({
      title: 'x',
      severity: 'BAD'
    });

    const response = await POST({
      request: new Request('http://localhost/api/incidents', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: unknown };
    expect(body.error).toBeDefined();
  });
});
