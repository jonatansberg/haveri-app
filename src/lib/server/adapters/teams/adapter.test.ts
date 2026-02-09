import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbSelect = vi.hoisted(() => vi.fn());
const mockAcknowledgeIncidentEscalation = vi.hoisted(() => vi.fn());
const mockFindIncidentByChannel = vi.hoisted(() => vi.fn());
const mockDeclareIncidentWithWorkflow = vi.hoisted(() => vi.fn());
const mockSyncGlobalIncidentAnnouncement = vi.hoisted(() => vi.fn());
const mockResolveMemberByNameHint = vi.hoisted(() => vi.fn());
const mockResolveMemberByPlatformIdentity = vi.hoisted(() => vi.fn());
const mockIncidentService = vi.hoisted(() => ({
  resolveIncident: vi.fn(),
  updateStatus: vi.fn(),
  changeSeverity: vi.fn(),
  assignLead: vi.fn(),
  addEvent: vi.fn()
}));

vi.mock('$lib/server/db/client', () => ({
  db: { select: mockDbSelect }
}));

vi.mock('$lib/server/services/escalation-service', () => ({
  acknowledgeIncidentEscalation: mockAcknowledgeIncidentEscalation
}));

vi.mock('$lib/server/services/incident-queries', () => ({
  findIncidentByChannel: mockFindIncidentByChannel
}));

vi.mock('$lib/server/services/incident-workflow-service', () => ({
  declareIncidentWithWorkflow: mockDeclareIncidentWithWorkflow,
  syncGlobalIncidentAnnouncement: mockSyncGlobalIncidentAnnouncement
}));

vi.mock('$lib/server/services/member-identity-service', () => ({
  resolveMemberByNameHint: mockResolveMemberByNameHint,
  resolveMemberByPlatformIdentity: mockResolveMemberByPlatformIdentity
}));

vi.mock('$lib/server/services/incident-service', () => ({
  incidentService: mockIncidentService
}));

import { handleTeamsInbound } from './adapter';

function selectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn()
  };

  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);

  return chain;
}

describe('teams adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles /incident command and maps workflow roles', async () => {
    mockDbSelect.mockReturnValueOnce(selectChain([{ id: 'facility-1' }]));
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });
    mockResolveMemberByNameHint
      .mockResolvedValueOnce({ memberId: 'member-resp', name: 'Alex' })
      .mockResolvedValueOnce({ memberId: 'member-comms', name: 'Sara' });
    mockDeclareIncidentWithWorkflow.mockResolvedValue({
      incidentId: 'inc-1',
      channelRef: 'teams:channel:inc-1',
      globalChannelRef: 'teams:global:haveri'
    });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-1',
      type: 'message',
      text: '/incident SEV1 @resp:Alex @comms:Sara Line is down',
      channelId: 'teams:source:1',
      userId: 'teams-user-1',
      userName: 'Operator'
    });

    expect(mockDeclareIncidentWithWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        title: 'Line is down',
        severity: 'SEV1',
        facilityId: 'facility-1',
        declaredByMemberId: 'member-actor',
        responsibleLeadMemberId: 'member-resp',
        commsLeadMemberId: 'member-comms'
      })
    );
    expect(result).toEqual({
      ok: true,
      action: 'incident_declared',
      incidentId: 'inc-1',
      incidentChannelRef: 'teams:channel:inc-1',
      globalChannelRef: 'teams:global:haveri'
    });
  });

  it('handles /status command and syncs global announcement', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-2',
      type: 'message',
      text: '/status inc-1 MITIGATED',
      channelId: 'teams:incident:1',
      userId: 'teams-user-1'
    });

    expect(mockIncidentService.updateStatus).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      newStatus: 'MITIGATED',
      actorMemberId: 'member-actor',
      actorExternalId: 'teams-user-1'
    });
    expect(mockSyncGlobalIncidentAnnouncement).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });
    expect(result).toEqual({
      ok: true,
      action: 'incident_status_updated',
      incidentId: 'inc-1',
      status: 'MITIGATED'
    });
  });

  it('handles /mitigated without explicit incident id by resolving channel incident', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });
    mockFindIncidentByChannel.mockResolvedValue({ id: 'inc-1', title: 'Incident 1' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-2m',
      type: 'message',
      text: '/mitigated',
      channelId: 'teams:incident:1',
      userId: 'teams-user-1'
    });

    expect(mockIncidentService.updateStatus).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      newStatus: 'MITIGATED',
      actorMemberId: 'member-actor',
      actorExternalId: 'teams-user-1'
    });
    expect(result).toEqual({
      ok: true,
      action: 'incident_status_updated',
      incidentId: 'inc-1',
      status: 'MITIGATED'
    });
  });

  it('handles /severity command and syncs global announcement', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });
    mockFindIncidentByChannel.mockResolvedValue({ id: 'inc-11', title: 'Incident 11' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-sev',
      type: 'message',
      text: '/severity 1',
      channelId: 'teams:incident:11',
      userId: 'teams-user-1'
    });

    expect(mockIncidentService.changeSeverity).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-11',
      severity: 'SEV1',
      actorMemberId: 'member-actor'
    });
    expect(result).toEqual({
      ok: true,
      action: 'incident_severity_updated',
      incidentId: 'inc-11',
      severity: 'SEV1'
    });
  });

  it('handles /lead command and syncs global announcement', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });
    mockFindIncidentByChannel.mockResolvedValue({ id: 'inc-12', title: 'Incident 12' });
    mockResolveMemberByNameHint.mockResolvedValue({ memberId: 'member-target', name: 'Alex' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-lead',
      type: 'message',
      text: '/lead @Alex',
      channelId: 'teams:incident:12',
      userId: 'teams-user-1'
    });

    expect(mockResolveMemberByNameHint).toHaveBeenCalledWith({
      organizationId: 'org-1',
      nameHint: 'Alex'
    });
    expect(mockIncidentService.assignLead).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-12',
      memberId: 'member-target',
      actorMemberId: 'member-actor'
    });
    expect(result).toEqual({
      ok: true,
      action: 'incident_lead_updated',
      incidentId: 'inc-12',
      leadMemberId: 'member-target'
    });
  });

  it('handles /resolve command and syncs global announcement', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-2b',
      type: 'message',
      text: '/resolve inc-1 Cleared obstruction and restarted',
      channelId: 'teams:incident:1',
      userId: 'teams-user-1'
    });

    expect(mockIncidentService.resolveIncident).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      actorMemberId: 'member-actor',
      summary: {
        whatHappened: 'Cleared obstruction and restarted',
        rootCause: 'Unknown (resolved through chat command)',
        resolution: 'Cleared obstruction and restarted',
        impact: {}
      }
    });
    expect(mockSyncGlobalIncidentAnnouncement).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });
    expect(result).toEqual({
      ok: true,
      action: 'incident_resolved',
      incidentId: 'inc-1'
    });
  });

  it('handles /ack command and syncs global announcement', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-2c',
      type: 'message',
      text: '/ack inc-1',
      channelId: 'teams:incident:1',
      userId: 'teams-user-1'
    });

    expect(mockAcknowledgeIncidentEscalation).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      actorMemberId: 'member-actor'
    });
    expect(mockSyncGlobalIncidentAnnouncement).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });
    expect(result).toEqual({
      ok: true,
      action: 'incident_acknowledged',
      incidentId: 'inc-1'
    });
  });

  it('captures non-command messages for linked incident channels', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue(null);
    mockFindIncidentByChannel.mockResolvedValue({ id: 'inc-99', title: 'Existing incident' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-3',
      type: 'message',
      text: 'Operator confirms pressure drop',
      channelId: 'teams:incident:99',
      userId: 'teams-user-3',
      userName: 'Operator 3',
      timestamp: '2026-02-06T22:00:00.000Z',
      attachments: [
        {
          name: 'photo.jpg',
          contentType: 'image/jpeg',
          contentUrl: 'https://files.example/photo.jpg'
        }
      ]
    });

    expect(mockIncidentService.addEvent).toHaveBeenCalledTimes(1);
    const addEventCall = mockIncidentService.addEvent.mock.calls[0]?.[0] as {
      event: {
        organizationId: string;
        incidentId: string;
        eventType: string;
        actorType: string;
        actorMemberId: string | null;
        sourcePlatform: string;
        sourceEventId: string;
        payload: Record<string, unknown>;
      };
    };
    expect(addEventCall.event.organizationId).toBe('org-1');
    expect(addEventCall.event.incidentId).toBe('inc-99');
    expect(addEventCall.event.eventType).toBe('message');
    expect(addEventCall.event.actorType).toBe('integration');
    expect(addEventCall.event.actorMemberId).toBeNull();
    expect(addEventCall.event.sourcePlatform).toBe('teams');
    expect(addEventCall.event.sourceEventId).toBe('msg-3');
    expect(addEventCall.event.payload).toMatchObject({
      attachments: [
        {
          name: 'photo.jpg',
          contentType: 'image/jpeg',
          contentUrl: 'https://files.example/photo.jpg'
        }
      ]
    });
    expect(result).toEqual({
      ok: true,
      action: 'message_captured',
      incidentId: 'inc-99'
    });
  });

  it('ignores non-command messages in channels without active incidents', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });
    mockFindIncidentByChannel.mockResolvedValue(null);

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-3b',
      type: 'message',
      text: 'FYI no incident context',
      channelId: 'teams:channel:other',
      userId: 'teams-user-3'
    });

    expect(result).toEqual({
      ok: true,
      action: 'ignored',
      reason: 'No incident linked to channel'
    });
  });

  it('returns help for unknown commands', async () => {
    mockResolveMemberByPlatformIdentity.mockResolvedValue({ memberId: 'member-actor', name: 'Actor' });

    const result = await handleTeamsInbound('org-1', {
      id: 'msg-4',
      type: 'message',
      text: '/nonsense',
      channelId: 'teams:incident:77',
      userId: 'teams-user-1'
    });

    expect(result).toEqual({
      ok: false,
      action: 'unknown_command',
      help:
        'Supported commands: /incident|/haveri [SEV1|SEV2|SEV3] <title> [@resp:Name] [@comms:Name], /status [id] <STATUS>, /investigating [id], /mitigated [id], /severity [id] <1|2|3|SEV1|SEV2|SEV3>, /lead [id] @Name, /resolve [id] <summary>, /ack [id>'
    });
  });
});
