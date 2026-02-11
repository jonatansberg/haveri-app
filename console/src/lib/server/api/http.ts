import { json } from '@sveltejs/kit';
import { ConflictError, NotFoundError, ValidationError } from '$lib/server/services/errors';

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ValidationError) {
    return json({ error: error.message }, { status: 400 });
  }

  if (error instanceof NotFoundError) {
    return json({ error: error.message }, { status: 404 });
  }

  if (error instanceof ConflictError) {
    return json({ error: error.message }, { status: 409 });
  }

  if (error instanceof Error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ error: 'Unknown error' }, { status: 500 });
}
