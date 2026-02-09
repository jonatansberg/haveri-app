import { describe, expect, it } from 'vitest';
import { computeReminderType } from './follow-up-reminder-rules';

describe('computeReminderType', () => {
  const referenceDate = new Date('2026-02-09T08:00:00.000Z');

  it('returns DUE_TOMORROW when due date is the next day', () => {
    expect(computeReminderType({ dueDate: '2026-02-10', referenceDate })).toBe('DUE_TOMORROW');
  });

  it('returns DUE_TODAY when due date matches today', () => {
    expect(computeReminderType({ dueDate: '2026-02-09', referenceDate })).toBe('DUE_TODAY');
  });

  it('returns OVERDUE_1D when due date is yesterday', () => {
    expect(computeReminderType({ dueDate: '2026-02-08', referenceDate })).toBe('OVERDUE_1D');
  });

  it('returns null when due date is outside reminder windows', () => {
    expect(computeReminderType({ dueDate: '2026-02-11', referenceDate })).toBeNull();
    expect(computeReminderType({ dueDate: '2026-02-07', referenceDate })).toBeNull();
  });
});
