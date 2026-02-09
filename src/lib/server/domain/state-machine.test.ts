import { describe, expect, it } from 'vitest';
import { assertValidStatusTransition } from './state-machine';

describe('incident state machine', () => {
  it('allows declared to investigating', () => {
    expect(() => assertValidStatusTransition('DECLARED', 'INVESTIGATING')).not.toThrow();
  });

  it('blocks declared to resolved (skip not allowed)', () => {
    expect(() => assertValidStatusTransition('DECLARED', 'RESOLVED')).toThrow(
      /Illegal incident status transition/
    );
  });

  it('blocks investigating to resolved (skip not allowed)', () => {
    expect(() => assertValidStatusTransition('INVESTIGATING', 'RESOLVED')).toThrow(
      /Illegal incident status transition/
    );
  });

  it('allows closed to investigating for reopen flow', () => {
    expect(() => assertValidStatusTransition('CLOSED', 'INVESTIGATING')).not.toThrow();
  });
});
