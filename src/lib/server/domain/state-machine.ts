import type { IncidentStatus } from '$lib/shared/domain';

const allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  DECLARED: ['INVESTIGATING'],
  INVESTIGATING: ['MITIGATED'],
  MITIGATED: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: ['INVESTIGATING']
};

export function assertValidStatusTransition(current: IncidentStatus, next: IncidentStatus): void {
  const allowed = allowedTransitions[current];
  if (!allowed.includes(next)) {
    throw new Error(`Illegal incident status transition: ${current} -> ${next}`);
  }
}
