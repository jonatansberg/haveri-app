function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function getAuthResultErrorMessage(result: unknown, fallback: string): string | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const candidate = result as { error?: { message?: unknown; statusText?: unknown } | null };
  if (!candidate.error) {
    return null;
  }

  return (
    asNonEmptyString(candidate.error.message) ??
    asNonEmptyString(candidate.error.statusText) ??
    fallback
  );
}

export function getAuthThrownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return asNonEmptyString(error.message) ?? fallback;
  }

  return asNonEmptyString(error) ?? fallback;
}

export function getAuthUnexpectedResultMessage(result: unknown): string | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const candidate = result as { data?: unknown; error?: unknown };
  if (candidate.error) {
    return null;
  }

  if (typeof candidate.data === 'string' && /<html|<!doctype html/i.test(candidate.data)) {
    return 'Auth endpoint returned HTML instead of API data. Check BETTER_AUTH_URL and current app origin.';
  }

  return null;
}
