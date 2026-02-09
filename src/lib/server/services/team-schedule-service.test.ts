import { describe, expect, it } from 'vitest';
import { isTeamActiveAt } from './team-schedule-service';

describe('isTeamActiveAt', () => {
  it('treats teams as always active when no schedule is configured', () => {
    expect(isTeamActiveAt({}, 'UTC', new Date('2026-02-09T01:00:00Z'))).toBe(true);
  });

  it('returns active when current time is inside an assigned window', () => {
    expect(
      isTeamActiveAt(
        {
          windows: {
            mon: ['06:00-18:00']
          }
        },
        'UTC',
        new Date('2026-02-09T12:00:00Z')
      )
    ).toBe(true);
  });

  it('returns inactive when current time is outside assigned windows', () => {
    expect(
      isTeamActiveAt(
        {
          windows: {
            mon: ['06:00-18:00']
          }
        },
        'UTC',
        new Date('2026-02-09T22:00:00Z')
      )
    ).toBe(false);
  });
});
