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

  const candidate = result as { error?: { message?: unknown } | null };
  if (!candidate.error) {
    return null;
  }

  return asNonEmptyString(candidate.error.message) ?? fallback;
}

export function getAuthThrownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return asNonEmptyString(error.message) ?? fallback;
  }

  return asNonEmptyString(error) ?? fallback;
}
