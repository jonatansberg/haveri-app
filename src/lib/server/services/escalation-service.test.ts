import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbSelect = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db/client', () => ({
  db: { select: mockDbSelect },
  withTransaction: vi.fn()
}));

vi.mock('./event-store', () => ({
  appendIncidentEvent: vi.fn()
}));

import { selectEscalationPolicyForIncident } from './escalation-service';

function selectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    then: vi.fn()
  };

  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);
  chain.then.mockImplementation((resolve: (value: unknown[]) => unknown) =>
    Promise.resolve(resolve(rows))
  );

  return chain;
}

describe('selectEscalationPolicyForIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-09T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prefers most-specific matching policy', async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectChain([
          {
            facilityId: 'facility-1',
            areaId: 'area-line-2',
            severity: 'SEV2',
            timezone: 'UTC'
          }
        ])
      )
      .mockReturnValueOnce(selectChain([{ assetType: 'valve' }]))
      .mockReturnValueOnce(
        selectChain([
          { id: 'policy-general', conditions: { severity: ['SEV2'] } },
          {
            id: 'policy-area',
            conditions: { severity: ['SEV2'], areaId: 'area-line-2' }
          },
          {
            id: 'policy-asset',
            conditions: {
              severity: ['SEV2'],
              areaId: 'area-line-2',
              assetType: ['valve']
            }
          }
        ])
      )
      .mockReturnValueOnce(
        selectChain([{ stepOrder: 1, delayMinutes: 0, ifUnacked: false }])
      );

    const result = await selectEscalationPolicyForIncident({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });

    expect(result).toEqual({
      policyId: 'policy-asset',
      steps: [{ stepOrder: 1, delayMinutes: 0, ifUnacked: false }]
    });
  });

  it('honors time window matching in facility timezone', async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectChain([
          {
            facilityId: 'facility-1',
            areaId: 'area-line-2',
            severity: 'SEV1',
            timezone: 'UTC'
          }
        ])
      )
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(
        selectChain([
          {
            id: 'policy-day',
            conditions: { severity: ['SEV1'], timeWindow: ['06:00-18:00'] }
          },
          {
            id: 'policy-night',
            conditions: { severity: ['SEV1'], timeWindow: ['18:00-06:00'] }
          }
        ])
      )
      .mockReturnValueOnce(
        selectChain([{ stepOrder: 1, delayMinutes: 0, ifUnacked: false }])
      );

    const result = await selectEscalationPolicyForIncident({
      organizationId: 'org-1',
      incidentId: 'inc-2'
    });

    expect(result?.policyId).toBe('policy-day');
  });
});
