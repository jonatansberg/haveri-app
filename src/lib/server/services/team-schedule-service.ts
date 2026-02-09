type TeamShiftInfo = Record<string, unknown>;

function parseMinuteValue(value: string): number | null {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

function toMinutesInTimezone(at: Date, timezone: string): number {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone
  }).format(at);

  return parseMinuteValue(formatted) ?? 0;
}

function toDayKeyInTimezone(at: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: timezone
  })
    .format(at)
    .toLowerCase()
    .slice(0, 3);
}

function parseWindows(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

function matchesWindow(window: string, currentMinutes: number): boolean {
  const [startRaw, endRaw] = window.split('-');
  const start = parseMinuteValue(startRaw ?? '');
  const end = parseMinuteValue(endRaw ?? '');

  if (start === null || end === null) {
    return false;
  }

  if (start === end) {
    return true;
  }

  if (start < end) {
    return currentMinutes >= start && currentMinutes < end;
  }

  return currentMinutes >= start || currentMinutes < end;
}

export function isTeamActiveAt(shiftInfo: TeamShiftInfo, timezone: string, at: Date = new Date()): boolean {
  const dayKey = toDayKeyInTimezone(at, timezone);
  const windowsValue = shiftInfo['windows'];
  const windowsContainer =
    typeof windowsValue === 'object' && windowsValue !== null
      ? (windowsValue as Record<string, unknown>)
      : shiftInfo;
  const configuredDayKeys = Object.keys(windowsContainer);

  if (configuredDayKeys.length === 0) {
    return true;
  }

  const windows = parseWindows(windowsContainer[dayKey]);
  if (windows.length === 0) {
    return false;
  }

  const currentMinutes = toMinutesInTimezone(at, timezone);
  return windows.some((window) => matchesWindow(window, currentMinutes));
}
