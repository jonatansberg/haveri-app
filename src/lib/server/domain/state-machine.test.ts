import { describe, expect, it } from 'vitest';
import { assertValidStatusTransition } from './state-machine';

describe('incident state machine', () => {
  it('allows declared to investigating', () => {
    expect(() => assertValidStatusTransition('DECLARED', 'INVESTIGATING')).not.toThrow();
  });

  it('blocks closed to investigating', () => {
    expect(() => assertValidStatusTransition('CLOSED', 'INVESTIGATING')).toThrow(
      /Illegal incident status transition/
    );
  });
});
