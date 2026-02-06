import { error, type RequestEvent } from '@sveltejs/kit';

export function requireUser(event: RequestEvent): NonNullable<App.Locals['user']> {
  if (!event.locals.user) {
    throw error(401, 'Unauthorized');
  }

  return event.locals.user;
}

export function getOrganizationId(event: RequestEvent): string {
  return event.locals.organizationId;
}
