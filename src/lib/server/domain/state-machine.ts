import type { IncidentStatus } from '$lib/shared/domain';

const allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  DECLARED: ['INVESTIGATING', 'RESOLVED'],
  INVESTIGATING: ['MITIGATED', 'RESOLVED'],
  MITIGATED: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: []
};

export function assertValidStatusTransition(current: IncidentStatus, next: IncidentStatus): void {
  const allowed = allowedTransitions[current];
  if (!allowed.includes(next)) {
    throw new Error(`Illegal incident status transition: ${current} -> ${next}`);
  }
}
