import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbSelect = vi.hoisted(() => vi.fn());
const mockGetTeamsGlobalIncidentChannel = vi.hoisted(() => vi.fn());
const mockGetTeamsIncidentChannelPrefix = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db/client', () => ({
  db: { select: mockDbSelect }
}));

vi.mock('$lib/server/services/env', () => ({
  getTeamsGlobalIncidentChannel: mockGetTeamsGlobalIncidentChannel,
  getTeamsIncidentChannelPrefix: mockGetTeamsIncidentChannelPrefix
}));

import {
  buildTeamsIncidentCard,
  createTeamsIncidentChannel,
  getTeamsChatSettings
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
  });

  it('returns stored chat settings when present', async () => {
    mockDbSelect.mockReturnValueOnce(
      selectChain([{ globalIncidentChannelRef: 'teams:global:configured', autoCreateIncidentChannel: false }])
    );

    const settings = await getTeamsChatSettings('org-1');

    expect(settings).toEqual({
      globalIncidentChannelRef: 'teams:global:configured',
      autoCreateIncidentChannel: false
    });
  });

  it('falls back to env-based settings when org settings are missing', async () => {
    mockDbSelect.mockReturnValueOnce(selectChain([]));

    const settings = await getTeamsChatSettings('org-1');

    expect(settings).toEqual({
      globalIncidentChannelRef: 'teams:global:fallback',
      autoCreateIncidentChannel: true
    });
  });

  it('creates sanitized incident channel names from title + severity', async () => {
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

  it('builds structured incident cards for global announcements', () => {
    const card = buildTeamsIncidentCard({
      incidentId: 'inc-1',
      title: 'Conveyor line stopped',
      severity: 'SEV1',
      status: 'DECLARED',
      facilityName: 'Plant North',
      channelRef: 'teams:channel:incident-1',
      responsibleLead: 'Alex Rivera',
      commsLead: 'Sara Kim',
      tags: ['line-down']
    });

    expect(card).toEqual(
      expect.objectContaining({
        type: 'haveri.incident.summary.v1',
        incidentId: 'inc-1',
        severity: 'SEV1',
        status: 'DECLARED',
        responsibleLead: 'Alex Rivera',
        commsLead: 'Sara Kim',
        tags: ['line-down']
      })
    );
  });
});
