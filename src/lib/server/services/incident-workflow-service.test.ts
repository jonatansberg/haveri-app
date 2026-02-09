import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationError } from './errors';

const mockDbSelect = vi.hoisted(() => vi.fn());
const mockDbUpdate = vi.hoisted(() => vi.fn());
const mockScheduleEscalationForIncident = vi.hoisted(() => vi.fn());
const mockGetTeamsChatSettings = vi.hoisted(() => vi.fn());
const mockGetChatAdapter = vi.hoisted(() => vi.fn());
const mockChatAdapter = vi.hoisted(() => ({
  onMessage: vi.fn(),
  onCommand: vi.fn(),
  createChannel: vi.fn(),
  archiveChannel: vi.fn(),
  sendMessage: vi.fn(),
  sendCard: vi.fn(),
  addMembers: vi.fn(),
  resolveUser: vi.fn(),
  buildIncidentCard: vi.fn()
}));
const mockGetIncidentDetail = vi.hoisted(() => vi.fn());
const mockIncidentService = vi.hoisted(() => ({
  declareIncident: vi.fn(),
  addEvent: vi.fn(),
  setAnnouncementRefs: vi.fn()
}));

vi.mock('$lib/server/db/client', () => ({
  db: { select: mockDbSelect, update: mockDbUpdate }
}));

vi.mock('$lib/server/queue/scheduler', () => ({
  scheduleEscalationForIncident: mockScheduleEscalationForIncident
}));

vi.mock('$lib/server/adapters/teams/chat-ops', () => ({
  getTeamsChatSettings: mockGetTeamsChatSettings
}));

vi.mock('$lib/server/adapters/chat/factory', () => ({
  getChatAdapter: mockGetChatAdapter
}));

vi.mock('./incident-queries', () => ({
  getIncidentDetail: mockGetIncidentDetail
}));

vi.mock('./incident-service', () => ({
  incidentService: mockIncidentService
}));

import {
  declareIncidentWithWorkflow,
  staticIncidentWorkflow,
  syncGlobalIncidentAnnouncement
} from './incident-workflow-service';

function selectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    innerJoin: vi.fn(),
    leftJoin: vi.fn(),
    limit: vi.fn(),
    then: vi.fn()
  };

  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);
  chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) =>
    Promise.resolve(resolve(rows))
  );

  return chain;
}

describe('incident-workflow-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetChatAdapter.mockReturnValue(mockChatAdapter);
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    });
  });

  it('declares a Teams incident with workflow roles and global announcement', async () => {
    mockDbSelect
      .mockReturnValueOnce(selectChain([{ id: 'member-resp' }]))
      .mockReturnValueOnce(selectChain([{ id: 'member-comms' }]))
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([]));

    mockGetTeamsChatSettings.mockResolvedValue({
      globalIncidentChannelRef: 'teams:global:haveri',
      autoCreateIncidentChannel: true,
      autoArchiveOnClose: false
    });
    mockChatAdapter.createChannel.mockResolvedValue({
      channelRef: 'teams:channel:incident-sev1-line-down',
      channelName: 'incident-sev1-line-down'
    });
    mockIncidentService.declareIncident.mockResolvedValue({ id: 'inc-1' });
    mockGetIncidentDetail.mockResolvedValue({
      incident: {
        id: 'inc-1',
        title: 'Line stopped',
        severity: 'SEV1',
        status: 'DECLARED',
        facilityName: 'Plant North',
        chatChannelRef: 'teams:channel:incident-sev1-line-down',
        responsibleLead: 'Alex Rivera',
        commsLead: 'Sara Kim',
        tags: ['line-down']
      }
    });
    mockChatAdapter.buildIncidentCard.mockReturnValue({ type: 'card' });
    mockChatAdapter.sendCard.mockResolvedValue({
      messageRef: 'teams|team-1|channel-1|message|msg-1',
      channelRef: 'teams|team-1|channel-1'
    });

    const result = await declareIncidentWithWorkflow({
      organizationId: 'org-1',
      title: 'Line stopped',
      severity: 'SEV1',
      declaredByMemberId: 'member-declarer',
      facilityId: 'facility-1',
      responsibleLeadMemberId: 'member-resp',
      commsLeadMemberId: 'member-comms',
      chatPlatform: 'teams',
      sourceChannelRef: 'teams:source:1',
      tags: ['line-down']
    });

    expect(result).toEqual({
      incidentId: 'inc-1',
      channelRef: 'teams:channel:incident-sev1-line-down',
      globalChannelRef: 'teams:global:haveri'
    });
    expect(mockGetChatAdapter).toHaveBeenCalledWith('teams');
    expect(mockChatAdapter.createChannel).toHaveBeenCalledWith(
      expect.stringMatching(/^inc-/),
      [],
      {
        severity: 'SEV1'
      }
    );
    expect(mockIncidentService.declareIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        assignedToMemberId: 'member-resp',
        commsLeadMemberId: 'member-comms',
        chatChannelRef: 'teams:source:1',
        globalChannelRef: 'teams:global:haveri'
      })
    );
    expect(mockIncidentService.addEvent).toHaveBeenCalledTimes(1);
    const addEventCall = mockIncidentService.addEvent.mock.calls[0]?.[0] as {
      event: {
        incidentId: string;
        eventType: string;
        payload: {
          workflowVersion: string;
          responsibleLeadMemberId: string;
          commsLeadMemberId: string;
        };
      };
    };
    expect(addEventCall.event.incidentId).toBe('inc-1');
    expect(addEventCall.event.eventType).toBe('triage_response');
    expect(addEventCall.event.payload.workflowVersion).toBe(staticIncidentWorkflow.version);
    expect(addEventCall.event.payload.responsibleLeadMemberId).toBe('member-resp');
    expect(addEventCall.event.payload.commsLeadMemberId).toBe('member-comms');
    expect(mockIncidentService.setAnnouncementRefs).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      globalChannelRef: 'teams|team-1|channel-1',
      globalMessageRef: 'teams|team-1|channel-1|message|msg-1'
    });
    expect(mockScheduleEscalationForIncident).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });
  });

  it('uses an injected chat adapter without changing workflow behavior', async () => {
    const injectedAdapter = {
      ...mockChatAdapter,
      createChannel: vi.fn().mockResolvedValue({
        channelRef: 'teams:channel:incident-injected',
        channelName: 'incident-injected'
      }),
      buildIncidentCard: vi.fn().mockReturnValue({ type: 'card' }),
      sendCard: vi.fn().mockResolvedValue({
        messageRef: 'teams|team-1|channel-9|message|msg-9',
        channelRef: 'teams|team-1|channel-9'
      })
    };

    mockDbSelect
      .mockReturnValueOnce(selectChain([{ id: 'member-resp' }]))
      .mockReturnValueOnce(selectChain([{ id: 'member-comms' }]))
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([]));
    mockGetTeamsChatSettings.mockResolvedValue({
      globalIncidentChannelRef: 'teams:global:haveri',
      autoCreateIncidentChannel: true,
      autoArchiveOnClose: false
    });
    mockIncidentService.declareIncident.mockResolvedValue({ id: 'inc-9' });
    mockGetIncidentDetail.mockResolvedValue({
      incident: {
        id: 'inc-9',
        title: 'Injected adapter incident',
        severity: 'SEV2',
        status: 'DECLARED',
        facilityName: 'Plant North',
        chatChannelRef: 'teams:channel:incident-injected',
        responsibleLead: 'Alex Rivera',
        commsLead: 'Sara Kim',
        tags: []
      }
    });

    await declareIncidentWithWorkflow({
      organizationId: 'org-1',
      title: 'Injected adapter incident',
      severity: 'SEV2',
      facilityId: 'facility-1',
      chatPlatform: 'teams',
      responsibleLeadMemberId: 'member-resp',
      commsLeadMemberId: 'member-comms',
      chatAdapter: injectedAdapter
    });

    expect(mockGetChatAdapter).not.toHaveBeenCalled();
    expect(injectedAdapter.createChannel).toHaveBeenCalledWith(
      expect.stringMatching(/^inc-/),
      [],
      {
        severity: 'SEV2'
      }
    );
    expect(injectedAdapter.sendCard).toHaveBeenCalled();
  });

  it('throws when no responsible lead can be resolved', async () => {
    mockDbSelect.mockReturnValueOnce(selectChain([]));

    await expect(
      declareIncidentWithWorkflow({
        organizationId: 'org-1',
        title: 'Line stopped',
        severity: 'SEV2',
        facilityId: 'facility-1',
        chatPlatform: 'web'
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updates existing global incident card and backfills channel ref', async () => {
    mockGetIncidentDetail.mockResolvedValue({
      incident: {
        id: 'inc-77',
        title: 'Hydraulics unstable',
        severity: 'SEV2',
        status: 'INVESTIGATING',
        facilityName: 'Plant North',
        chatChannelRef: 'teams:channel:hydraulics',
        responsibleLead: 'Alex Rivera',
        commsLead: null,
        tags: [],
        chatPlatform: 'teams',
        globalChannelRef: null,
        globalMessageRef: 'teams:message:77'
      }
    });
    mockGetTeamsChatSettings.mockResolvedValue({
      globalIncidentChannelRef: 'teams:global:haveri',
      autoCreateIncidentChannel: true,
      autoArchiveOnClose: false
    });
    mockChatAdapter.buildIncidentCard.mockReturnValue({ type: 'card' });
    mockChatAdapter.sendCard.mockResolvedValue({
      messageRef: 'teams|team-1|channel-haveri|message|msg-77',
      channelRef: 'teams|team-1|channel-haveri'
    });

    await syncGlobalIncidentAnnouncement({
      organizationId: 'org-1',
      incidentId: 'inc-77'
    });

    expect(mockGetChatAdapter).toHaveBeenCalledWith('teams');
    expect(mockChatAdapter.sendCard).toHaveBeenCalledWith(
      'teams:global:haveri',
      { type: 'card' },
      'teams:message:77'
    );
    expect(mockIncidentService.setAnnouncementRefs).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-77',
      globalChannelRef: 'teams|team-1|channel-haveri',
      globalMessageRef: 'teams|team-1|channel-haveri|message|msg-77'
    });
  });

  it('posts a new global incident card when message ref is missing', async () => {
    mockGetIncidentDetail.mockResolvedValue({
      incident: {
        id: 'inc-88',
        title: 'Packager drift',
        severity: 'SEV3',
        status: 'DECLARED',
        facilityName: 'Plant North',
        chatChannelRef: 'teams:channel:packager',
        responsibleLead: 'Alex Rivera',
        commsLead: 'Sara Kim',
        tags: ['packager'],
        chatPlatform: 'teams',
        globalChannelRef: null,
        globalMessageRef: null
      }
    });
    mockGetTeamsChatSettings.mockResolvedValue({
      globalIncidentChannelRef: 'teams:global:haveri',
      autoCreateIncidentChannel: true,
      autoArchiveOnClose: false
    });
    mockChatAdapter.buildIncidentCard.mockReturnValue({ type: 'card' });
    mockChatAdapter.sendCard.mockResolvedValue({
      messageRef: 'teams|team-1|channel-haveri|message|msg-88',
      channelRef: 'teams|team-1|channel-haveri'
    });

    await syncGlobalIncidentAnnouncement({
      organizationId: 'org-1',
      incidentId: 'inc-88'
    });

    expect(mockGetChatAdapter).toHaveBeenCalledWith('teams');
    expect(mockChatAdapter.sendCard).toHaveBeenCalledWith(
      'teams:global:haveri',
      { type: 'card' },
      undefined
    );
    expect(mockIncidentService.setAnnouncementRefs).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-88',
      globalChannelRef: 'teams|team-1|channel-haveri',
      globalMessageRef: 'teams|team-1|channel-haveri|message|msg-88'
    });
  });

  it('skips sync when incident is not on Teams platform', async () => {
    mockGetIncidentDetail.mockResolvedValue({
      incident: {
        id: 'inc-web',
        title: 'Web incident',
        severity: 'SEV3',
        status: 'DECLARED',
        facilityName: 'Plant North',
        chatChannelRef: 'web:channel:1',
        responsibleLead: 'Alex Rivera',
        commsLead: null,
        tags: [],
        chatPlatform: 'web',
        globalChannelRef: null,
        globalMessageRef: null
      }
    });

    await syncGlobalIncidentAnnouncement({
      organizationId: 'org-1',
      incidentId: 'inc-web'
    });

    expect(mockGetTeamsChatSettings).not.toHaveBeenCalled();
    expect(mockGetChatAdapter).not.toHaveBeenCalled();
    expect(mockChatAdapter.sendCard).not.toHaveBeenCalled();
  });
});
