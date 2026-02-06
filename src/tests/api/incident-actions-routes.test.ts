import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockGetOrganizationId = vi.hoisted(() => vi.fn());
const mockReadJson = vi.hoisted(() => vi.fn());
const mockToErrorResponse = vi.hoisted(() => vi.fn());
const mockSyncGlobalIncidentAnnouncement = vi.hoisted(() => vi.fn());
const mockAcknowledgeIncidentEscalation = vi.hoisted(() => vi.fn());
const mockGetIncidentDetail = vi.hoisted(() => vi.fn());
const mockIncidentService = vi.hoisted(() => ({
  updateStatus: vi.fn(),
  changeSeverity: vi.fn(),
  assignLead: vi.fn(),
  resolveIncident: vi.fn(),
  closeIncident: vi.fn()
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
  syncGlobalIncidentAnnouncement: mockSyncGlobalIncidentAnnouncement,
  staticIncidentWorkflow: { version: 'v1-static', roles: {}, statuses: {} }
}));

vi.mock('$lib/server/services/escalation-service', () => ({
  acknowledgeIncidentEscalation: mockAcknowledgeIncidentEscalation
}));

vi.mock('$lib/server/services/incident-queries', () => ({
  getIncidentDetail: mockGetIncidentDetail
}));

vi.mock('$lib/server/services/incident-service', () => ({
  incidentService: mockIncidentService
}));

import { GET as getIncident } from '../../routes/api/incidents/[id]/+server';
import { POST as ackIncident } from '../../routes/api/incidents/[id]/ack/+server';
import { POST as assignIncident } from '../../routes/api/incidents/[id]/assign/+server';
import { POST as closeIncident } from '../../routes/api/incidents/[id]/close/+server';
import { POST as resolveIncident } from '../../routes/api/incidents/[id]/resolve/+server';
import { POST as severityIncident } from '../../routes/api/incidents/[id]/severity/+server';
import { POST as statusIncident } from '../../routes/api/incidents/[id]/status/+server';

describe('incident action API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockReturnValue({ id: 'user-1' });
    mockGetOrganizationId.mockReturnValue('org-1');
    mockToErrorResponse.mockImplementation(() => new Response('error', { status: 500 }));
  });

  it('returns incident details and static workflow', async () => {
    mockGetIncidentDetail.mockResolvedValue({
      incident: { id: 'inc-1', title: 'Conveyor down' },
      summary: null,
      events: [],
      followUps: []
    });

    const response = await getIncident({
      params: { id: 'inc-1' },
      request: new Request('http://localhost/api/incidents/inc-1'),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof getIncident>[0]);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { incident: { id: string }; workflow: { version: string } };
    expect(body.incident.id).toBe('inc-1');
    expect(body.workflow.version).toBe('v1-static');
  });

  it('updates incident status and syncs global card', async () => {
    mockReadJson.mockResolvedValue({ status: 'MITIGATED' });

    const response = await statusIncident({
      params: { id: 'inc-2' },
      request: new Request('http://localhost/api/incidents/inc-2/status', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof statusIncident>[0]);

    expect(response.status).toBe(200);
    expect(mockIncidentService.updateStatus).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-2',
      newStatus: 'MITIGATED',
      actorExternalId: 'user-1'
    });
    expect(mockSyncGlobalIncidentAnnouncement).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-2'
    });
  });

  it('updates incident severity', async () => {
    mockReadJson.mockResolvedValue({ severity: 'SEV2' });

    const response = await severityIncident({
      params: { id: 'inc-3' },
      request: new Request('http://localhost/api/incidents/inc-3/severity', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof severityIncident>[0]);

    expect(response.status).toBe(200);
    expect(mockIncidentService.changeSeverity).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-3',
      severity: 'SEV2'
    });
  });

  it('assigns incident responsible lead', async () => {
    mockReadJson.mockResolvedValue({ memberId: '11111111-1111-1111-1111-111111111111' });

    const response = await assignIncident({
      params: { id: 'inc-4' },
      request: new Request('http://localhost/api/incidents/inc-4/assign', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof assignIncident>[0]);

    expect(response.status).toBe(200);
    expect(mockIncidentService.assignLead).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-4',
      memberId: '11111111-1111-1111-1111-111111111111'
    });
  });

  it('resolves incidents with structured summary payload', async () => {
    mockReadJson.mockResolvedValue({
      whatHappened: 'Conveyor line halted unexpectedly',
      rootCause: 'Jam at station 4',
      resolution: 'Cleared jam and restarted line',
      impact: { durationMinutes: 22 }
    });

    const response = await resolveIncident({
      params: { id: 'inc-5' },
      request: new Request('http://localhost/api/incidents/inc-5/resolve', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof resolveIncident>[0]);

    expect(response.status).toBe(200);
    expect(mockIncidentService.resolveIncident).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-5',
      summary: {
        whatHappened: 'Conveyor line halted unexpectedly',
        rootCause: 'Jam at station 4',
        resolution: 'Cleared jam and restarted line',
        impact: { durationMinutes: 22 }
      }
    });
  });

  it('closes incidents and normalizes follow-up payload', async () => {
    mockReadJson.mockResolvedValue({
      followUps: [
        {
          description: 'Inspect station 4 sensors',
          assignedToMemberId: '11111111-1111-1111-1111-111111111111',
          dueDate: '2026-03-01'
        },
        {
          description: 'Review standard startup SOP'
        }
      ]
    });

    const response = await closeIncident({
      params: { id: 'inc-6' },
      request: new Request('http://localhost/api/incidents/inc-6/close', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof closeIncident>[0]);

    expect(response.status).toBe(200);
    expect(mockIncidentService.closeIncident).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-6',
      followUps: [
        {
          description: 'Inspect station 4 sensors',
          assignedToMemberId: '11111111-1111-1111-1111-111111111111',
          dueDate: '2026-03-01'
        },
        {
          description: 'Review standard startup SOP',
          assignedToMemberId: null,
          dueDate: null
        }
      ]
    });
  });

  it('acknowledges escalations and syncs card', async () => {
    const response = await ackIncident({
      params: { id: 'inc-7' },
      request: new Request('http://localhost/api/incidents/inc-7/ack', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof ackIncident>[0]);

    expect(response.status).toBe(200);
    expect(mockAcknowledgeIncidentEscalation).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-7'
    });
    expect(mockSyncGlobalIncidentAnnouncement).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-7'
    });
  });

  it('returns 400 for invalid status payload', async () => {
    mockReadJson.mockResolvedValue({ status: 'BAD' });

    const response = await statusIncident({
      params: { id: 'inc-8' },
      request: new Request('http://localhost/api/incidents/inc-8/status', { method: 'POST' }),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof statusIncident>[0]);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: unknown };
    expect(body.error).toBeDefined();
  });

  it('returns mapped error response when incident detail lookup throws', async () => {
    mockGetIncidentDetail.mockRejectedValue(new Error('boom'));

    const response = await getIncident({
      params: { id: 'inc-err' },
      request: new Request('http://localhost/api/incidents/inc-err'),
      locals: { organizationId: 'org-1' }
    } as Parameters<typeof getIncident>[0]);

    expect(response.status).toBe(500);
  });
});
