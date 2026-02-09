import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbSelect = vi.hoisted(() => vi.fn());
const mockGetTeamsGlobalIncidentChannel = vi.hoisted(() => vi.fn());
const mockGetTeamsIncidentChannelPrefix = vi.hoisted(() => vi.fn());
const mockGetTeamsIncidentTeamId = vi.hoisted(() => vi.fn());
const mockCreateTeamsGraphClient = vi.hoisted(() => vi.fn());
const mockIsTeamsGraphConfigured = vi.hoisted(() => vi.fn());
const mockGraphClientCall = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db/client', () => ({
  db: { select: mockDbSelect }
}));

vi.mock('$lib/server/services/env', () => ({
  getTeamsGlobalIncidentChannel: mockGetTeamsGlobalIncidentChannel,
  getTeamsIncidentChannelPrefix: mockGetTeamsIncidentChannelPrefix,
  getTeamsIncidentTeamId: mockGetTeamsIncidentTeamId
}));

vi.mock('./graph-client', () => ({
  createTeamsGraphClient: mockCreateTeamsGraphClient,
  isTeamsGraphConfigured: mockIsTeamsGraphConfigured
}));

import {
  buildTeamsIncidentCard,
  createTeamsIncidentChannel,
  getTeamsChatSettings,
  postTeamsGlobalIncidentCard,
  updateTeamsGlobalIncidentCard
} from './chat-ops';

function selectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn()
  };

  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);

  return chain;
}

describe('teams chat-ops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTeamsGlobalIncidentChannel.mockReturnValue('teams:global:fallback');
    mockGetTeamsIncidentChannelPrefix.mockReturnValue('incident');
    mockGetTeamsIncidentTeamId.mockReturnValue('team-1');
    mockCreateTeamsGraphClient.mockReturnValue({ call: mockGraphClientCall });
    mockIsTeamsGraphConfigured.mockReturnValue(false);
  });

  it('returns stored chat settings when present', async () => {
    mockDbSelect.mockReturnValueOnce(
      selectChain([
        {
          globalIncidentChannelRef: 'teams:global:configured',
          autoCreateIncidentChannel: false,
          autoArchiveOnClose: true
        }
      ])
    );

    const settings = await getTeamsChatSettings('org-1');

    expect(settings).toEqual({
      globalIncidentChannelRef: 'teams:global:configured',
      autoCreateIncidentChannel: false,
      autoArchiveOnClose: true
    });
  });

  it('falls back to env-based settings when org settings are missing', async () => {
    mockDbSelect.mockReturnValueOnce(selectChain([]));

    const settings = await getTeamsChatSettings('org-1');

    expect(settings).toEqual({
      globalIncidentChannelRef: 'teams:global:fallback',
      autoCreateIncidentChannel: true,
      autoArchiveOnClose: false
    });
  });

  it('creates deterministic fallback channel refs when graph is not configured', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_706_000_000_000);

    const channel = await createTeamsIncidentChannel({
      incidentTitle: 'Packaging Line #4 Jammed!!!',
      severity: 'SEV2'
    });

    expect(channel).toEqual({
      channelRef: 'teams:channel:incident-sev2-packaging-line-4-jammed:1706000000000',
      channelName: 'incident-sev2-packaging-line-4-jammed'
    });

    nowSpy.mockRestore();
  });

  it('creates a real teams channel when graph is configured', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGraphClientCall.mockResolvedValueOnce({ id: '19:incident-channel-id@thread.tacv2' });

    const channel = await createTeamsIncidentChannel({
      incidentTitle: 'Conveyor line stalled',
      severity: 'SEV1'
    });

    expect(mockGraphClientCall).toHaveBeenCalledTimes(1);
    expect(channel).toEqual({
      channelRef: 'teams|team-1|19:incident-channel-id@thread.tacv2',
      channelName: 'incident-sev1-conveyor-line-stalled'
    });
  });

  it('throws when graph is configured but team id is missing during channel creation', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGetTeamsIncidentTeamId.mockReturnValue(null);

    await expect(
      createTeamsIncidentChannel({
        incidentTitle: 'Conveyor line stalled',
        severity: 'SEV1'
      })
    ).rejects.toThrow('TEAMS_INCIDENT_TEAM_ID is required');
  });

  it('builds adaptive cards for global incident announcements', () => {
    const card = buildTeamsIncidentCard({
      incidentId: 'inc-1',
      title: 'Conveyor line stopped',
      severity: 'SEV1',
      status: 'DECLARED',
      facilityName: 'Plant North',
      channelRef: 'teams|team-1|19:incident-channel@thread.tacv2',
      responsibleLead: 'Alex Rivera',
      commsLead: 'Sara Kim',
      tags: ['line-down']
    });

    expect(card).toEqual(
      expect.objectContaining({
        type: 'AdaptiveCard',
        version: '1.5'
      })
    );
    expect(card['body']).toBeInstanceOf(Array);
  });

  it('posts fallback global card refs when graph is not configured', async () => {
    const posted = await postTeamsGlobalIncidentCard({
      channelRef: 'teams:global:fallback',
      card: { type: 'AdaptiveCard' }
    });

    expect(posted.channelRef).toBe('teams:global:fallback');
    expect(posted.messageRef).toMatch(/^teams:message:/);
  });

  it('posts adaptive cards via graph when configured', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGraphClientCall.mockResolvedValueOnce({ id: 'msg-1' });

    const posted = await postTeamsGlobalIncidentCard({
      channelRef: 'team-1/19:global-channel@thread.tacv2',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(mockGraphClientCall).toHaveBeenCalledTimes(1);
    expect(posted).toEqual({
      channelRef: 'teams|team-1|19:global-channel@thread.tacv2',
      messageRef: 'teams|team-1|19:global-channel@thread.tacv2|message|msg-1'
    });
  });

  it('posts adaptive cards via graph when channel ref is already canonical', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGraphClientCall.mockResolvedValueOnce({ id: 'msg-2' });

    const posted = await postTeamsGlobalIncidentCard({
      channelRef: 'teams|team-2|19:global-canonical@thread.tacv2',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(posted).toEqual({
      channelRef: 'teams|team-2|19:global-canonical@thread.tacv2',
      messageRef: 'teams|team-2|19:global-canonical@thread.tacv2|message|msg-2'
    });
  });

  it('posts adaptive cards via graph with legacy teams:team:channel refs', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGraphClientCall.mockResolvedValueOnce({ id: 'msg-3' });

    const posted = await postTeamsGlobalIncidentCard({
      channelRef: 'teams:team-9:19:legacy-channel@thread.tacv2',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(posted).toEqual({
      channelRef: 'teams|team-9|19:legacy-channel@thread.tacv2',
      messageRef: 'teams|team-9|19:legacy-channel@thread.tacv2|message|msg-3'
    });
  });

  it('throws when posting a card cannot resolve a team id from channel ref', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGetTeamsIncidentTeamId.mockReturnValue(null);

    await expect(
      postTeamsGlobalIncidentCard({
        channelRef: '19:channel-without-team@thread.tacv2',
        card: { type: 'AdaptiveCard', body: [] }
      })
    ).rejects.toThrow('Unable to resolve Teams channel reference');
  });

  it('updates adaptive cards via graph when message ref is canonical', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGraphClientCall.mockResolvedValueOnce({});

    const updated = await updateTeamsGlobalIncidentCard({
      channelRef: 'teams|team-1|19:global-channel@thread.tacv2',
      messageRef: 'teams|team-1|19:global-channel@thread.tacv2|message|msg-77',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(mockGraphClientCall).toHaveBeenCalledTimes(1);
    expect(updated).toEqual({
      channelRef: 'teams|team-1|19:global-channel@thread.tacv2',
      messageRef: 'teams|team-1|19:global-channel@thread.tacv2|message|msg-77'
    });
  });

  it('returns unchanged refs on update when graph is not configured', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(false);

    const updated = await updateTeamsGlobalIncidentCard({
      channelRef: 'teams:global:fallback',
      messageRef: 'teams:message:legacy',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(updated).toEqual({
      channelRef: 'teams:global:fallback',
      messageRef: 'teams:message:legacy'
    });
  });

  it('posts a replacement card when graph update fails', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGraphClientCall.mockRejectedValueOnce(new Error('Patch not allowed')).mockResolvedValueOnce({
      id: 'msg-new'
    });

    const updated = await updateTeamsGlobalIncidentCard({
      channelRef: 'teams|team-1|19:global-channel@thread.tacv2',
      messageRef: 'teams|team-1|19:global-channel@thread.tacv2|message|msg-old',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(mockGraphClientCall).toHaveBeenCalledTimes(2);
    expect(updated).toEqual({
      channelRef: 'teams|team-1|19:global-channel@thread.tacv2',
      messageRef: 'teams|team-1|19:global-channel@thread.tacv2|message|msg-new'
    });
  });

  it('updates cards using legacy message refs by inferring channel context', async () => {
    mockIsTeamsGraphConfigured.mockReturnValue(true);
    mockGraphClientCall.mockResolvedValueOnce({});

    const updated = await updateTeamsGlobalIncidentCard({
      channelRef: 'teams:global:haveri-channel',
      messageRef: 'teams:message:legacy-msg-id',
      card: { type: 'AdaptiveCard', body: [] }
    });

    expect(updated).toEqual({
      channelRef: 'teams|team-1|haveri-channel',
      messageRef: 'teams|team-1|haveri-channel|message|legacy-msg-id'
    });
  });
});
