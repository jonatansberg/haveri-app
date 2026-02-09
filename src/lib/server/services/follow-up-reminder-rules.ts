export type FollowUpReminderType = 'DUE_TOMORROW' | 'DUE_TODAY' | 'OVERDUE_1D';

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function plusDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function computeReminderType(input: {
  dueDate: string | null;
  referenceDate: Date;
}): FollowUpReminderType | null {
  if (!input.dueDate) {
    return null;
  }

  const today = toDateOnly(input.referenceDate);
  const tomorrow = toDateOnly(plusDays(input.referenceDate, 1));
  const yesterday = toDateOnly(plusDays(input.referenceDate, -1));

  if (input.dueDate === tomorrow) {
    return 'DUE_TOMORROW';
  }

  if (input.dueDate === today) {
    return 'DUE_TODAY';
  }

  if (input.dueDate === yesterday) {
    return 'OVERDUE_1D';
  }

  return null;
}
