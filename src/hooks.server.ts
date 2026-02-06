import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { getDefaultOrgId } from '$lib/server/services/env';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

const publicApiPrefixes = ['/api/auth', '/api/chat/teams'];

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  event.locals.session = session?.session ?? null;
  event.locals.user = session?.user ?? null;
  event.locals.organizationId = event.request.headers.get('x-org-id') ?? getDefaultOrgId();

  if (
    event.url.pathname.startsWith('/api') &&
    !publicApiPrefixes.some((prefix) => event.url.pathname.startsWith(prefix)) &&
    !event.locals.user
  ) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'content-type': 'application/json'
      }
    });
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
