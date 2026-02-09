import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelectEscalationPolicyForIncident = vi.hoisted(() => vi.fn());
const mockWithTransaction = vi.hoisted(() => vi.fn());
const mockAppendIncidentEvent = vi.hoisted(() => vi.fn());
const mockQueueAdd = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/services/escalation-service', () => ({
  selectEscalationPolicyForIncident: mockSelectEscalationPolicyForIncident
}));

vi.mock('$lib/server/db/client', () => ({
  withTransaction: mockWithTransaction
}));

vi.mock('$lib/server/services/event-store', () => ({
  appendIncidentEvent: mockAppendIncidentEvent
}));

vi.mock('./queue', () => ({
  getEscalationQueue: () => ({
    add: mockQueueAdd
  })
}));

import { scheduleEscalationForIncident } from './scheduler';

describe('scheduleEscalationForIncident', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const update = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined)
        }))
      }));
      return callback({ update });
    });
    mockAppendIncidentEvent.mockResolvedValue(2);
  });

  it('schedules queued steps when a matching policy exists', async () => {
    mockSelectEscalationPolicyForIncident.mockResolvedValue({
      policyId: 'policy-1',
      steps: [
        { stepOrder: 1, delayMinutes: 0, ifUnacked: false },
        { stepOrder: 2, delayMinutes: 10, ifUnacked: true }
      ]
    });

    const result = await scheduleEscalationForIncident({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });

    expect(result).toEqual({ scheduled: true });
    expect(mockQueueAdd).toHaveBeenCalledTimes(2);
  });

  it('records fallback escalation path when no policy matches', async () => {
    mockSelectEscalationPolicyForIncident.mockResolvedValue(null);

    const result = await scheduleEscalationForIncident({
      organizationId: 'org-1',
      incidentId: 'inc-2'
    });

    expect(result).toEqual({ scheduled: true, reason: 'Fallback to declaring team' });
    const appendedEvent = mockAppendIncidentEvent.mock.calls[0]?.[1] as
      | {
          organizationId: string;
          incidentId: string;
          eventType: string;
          payload: Record<string, unknown>;
        }
      | undefined;
    expect(appendedEvent?.organizationId).toBe('org-1');
    expect(appendedEvent?.incidentId).toBe('inc-2');
    expect(appendedEvent?.eventType).toBe('escalation');
    expect(appendedEvent?.payload).toMatchObject({
      action: 'fallback_declaring_team'
    });
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });
});
