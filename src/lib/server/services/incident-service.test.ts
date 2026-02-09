import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationError } from './errors';

const mockWithTransaction = vi.hoisted(() => vi.fn());
const mockLockIncidentCurrentState = vi.hoisted(() => vi.fn());
const mockAppendIncidentEvent = vi.hoisted(() => vi.fn());
const mockScheduleEscalationForIncident = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db/client', () => ({
  withTransaction: mockWithTransaction
}));

vi.mock('./event-store', () => ({
  lockIncidentCurrentState: mockLockIncidentCurrentState,
  appendIncidentEvent: mockAppendIncidentEvent,
  insertInitialIncidentEvent: vi.fn()
}));

vi.mock('$lib/server/queue/scheduler', () => ({
  scheduleEscalationForIncident: mockScheduleEscalationForIncident
}));

import { incidentService } from './incident-service';

describe('incidentService.changeSeverity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({})
    );
    mockAppendIncidentEvent.mockResolvedValue(2);
    mockScheduleEscalationForIncident.mockResolvedValue({ scheduled: true });
  });

  it('appends severity_change event and schedules escalation re-evaluation for active incidents', async () => {
    mockLockIncidentCurrentState.mockResolvedValue({
      status: 'INVESTIGATING',
      severity: 'SEV3',
      assignedToMemberId: 'member-1',
      lastEventSequence: 4
    });

    await incidentService.changeSeverity({
      organizationId: 'org-1',
      incidentId: 'inc-1',
      severity: 'SEV1',
      actorMemberId: 'member-2'
    });

    expect(mockAppendIncidentEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationId: 'org-1',
        incidentId: 'inc-1',
        eventType: 'severity_change',
        payload: {
          from: 'SEV3',
          to: 'SEV1'
        }
      }),
      { severity: 'SEV1' }
    );
    expect(mockScheduleEscalationForIncident).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'inc-1'
    });
  });

  it('rejects severity changes once incident is resolved', async () => {
    mockLockIncidentCurrentState.mockResolvedValue({
      status: 'RESOLVED',
      severity: 'SEV2',
      assignedToMemberId: 'member-1',
      lastEventSequence: 6
    });

    await expect(
      incidentService.changeSeverity({
        organizationId: 'org-1',
        incidentId: 'inc-2',
        severity: 'SEV1',
        actorMemberId: 'member-2'
      })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mockAppendIncidentEvent).not.toHaveBeenCalled();
    expect(mockScheduleEscalationForIncident).not.toHaveBeenCalled();
  });
});

describe('incidentService.annotateSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppendIncidentEvent.mockResolvedValue(3);
    mockLockIncidentCurrentState.mockResolvedValue({
      status: 'RESOLVED',
      severity: 'SEV2',
      assignedToMemberId: 'member-1',
      lastEventSequence: 6
    });
    mockWithTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
      const values = vi.fn(() => ({ onConflictDoUpdate }));
      const insert = vi.fn(() => ({ values }));
      return callback({ insert });
    });
  });

  it('upserts summary fields and appends annotation event', async () => {
    await (incidentService as unknown as {
      annotateSummary: (input: {
        organizationId: string;
        incidentId: string;
        actorMemberId?: string | null;
        actorExternalId?: string | null;
        summary: {
          whatHappened: string;
          rootCause: string;
          resolution: string;
          impact: Record<string, unknown>;
          aiSummary?: string | null;
        };
      }) => Promise<void>;
    }).annotateSummary({
      organizationId: 'org-1',
      incidentId: 'inc-77',
      actorExternalId: 'user-1',
      summary: {
        whatHappened: 'Updated what happened',
        rootCause: 'Updated root cause',
        resolution: 'Updated resolution',
        impact: { durationMinutes: 17 }
      }
    });

    const appendedEvent = mockAppendIncidentEvent.mock.calls[0]?.[1] as
      | {
          organizationId: string;
          incidentId: string;
          eventType: string;
          payload: Record<string, unknown>;
        }
      | undefined;

    expect(appendedEvent?.organizationId).toBe('org-1');
    expect(appendedEvent?.incidentId).toBe('inc-77');
    expect(appendedEvent?.eventType).toBe('annotation');
    expect(appendedEvent?.payload).toMatchObject({
      field: 'summary',
      whatHappened: 'Updated what happened',
      rootCause: 'Updated root cause',
      resolution: 'Updated resolution'
    });
  });
});
