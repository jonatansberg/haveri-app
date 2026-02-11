import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { getDefaultOrgId } from '$lib/server/services/env';
import { resolveOrganizationContextForUser } from '$lib/server/services/organization-context-service';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

interface RequestLogContext {
  requestId: string | null;
  method: string;
  path: string;
  search: string;
  orgId: string;
  userId: string | null;
  host: string | null;
  forwardedHost: string | null;
  forwardedProto: string | null;
  forwardedFor: string | null;
}

function buildRequestLogContext(
  event: Parameters<Handle>[0]['event'],
  orgId: string,
  userId: string | null
): RequestLogContext {
  const url = new URL(event.request.url);

  return {
    requestId:
      event.request.headers.get('fly-request-id') ??
      event.request.headers.get('x-request-id') ??
      event.request.headers.get('traceparent'),
    method: event.request.method,
    path: url.pathname,
    search: url.search,
    orgId,
    userId,
    host: event.request.headers.get('host'),
    forwardedHost: event.request.headers.get('x-forwarded-host'),
    forwardedProto: event.request.headers.get('x-forwarded-proto'),
    forwardedFor: event.request.headers.get('x-forwarded-for')
  };
}

function logRequest(level: 'info' | 'warn' | 'error', message: string, details: Record<string, unknown>) {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger(message, details);
}

const reservedTopLevelSegments = new Set([
  'api',
  'login',
  'register',
  'incidents',
  'followups',
  'settings',
  'landing',
  'about',
  'contact',
  'blog'
]);

function parseSlugFromPath(pathname: string): { slug: string; rewrittenPathname: string } | null {
  const parts = pathname.split('/').filter((part) => part.length > 0);
  const first = parts[0];

  if (!first || reservedTopLevelSegments.has(first)) {
    return null;
  }

  const rewrittenPathname = `/${parts.slice(1).join('/')}`.replace(/\/+$/, '');
  return {
    slug: first,
    rewrittenPathname: rewrittenPathname === '' ? '/' : rewrittenPathname
  };
}

export const handle: Handle = async ({ event, resolve }) => {
  const startedAt = Date.now();
  const requestedOrgId = event.request.headers.get('x-org-id');
  const requestedOrgSlug = event.request.headers.get('x-org-slug');
  const slugFromPath = parseSlugFromPath(event.url.pathname);
  const requestedScopedSlug = requestedOrgSlug ?? slugFromPath?.slug ?? null;
  const defaultOrgId = getDefaultOrgId();
  let orgId = requestedOrgId ?? defaultOrgId;
  let orgSlug = 'default';

  try {
    const session = await auth.api.getSession({
      headers: event.request.headers
    });

    event.locals.session = session?.session ?? null;
    event.locals.user = session?.user ?? null;
    if (session?.user?.id) {
      const organizationContext = await resolveOrganizationContextForUser({
        userId: session.user.id,
        fallbackOrganizationId: defaultOrgId,
        ...(requestedOrgId ? { requestedOrganizationId: requestedOrgId } : {}),
        ...(requestedScopedSlug ? { requestedOrganizationSlug: requestedScopedSlug } : {})
      });

      if (!organizationContext) {
        logRequest('warn', 'Rejected request for unauthorized organization scope', {
          ...buildRequestLogContext(event, orgId, session.user.id),
          requestedOrgId,
          requestedOrgSlug
        });
        return new Response('Forbidden', { status: 403 });
      }

      orgId = organizationContext.organizationId;
      orgSlug = organizationContext.organizationSlug;

      if (slugFromPath?.slug === organizationContext.organizationSlug) {
        event.url.pathname = slugFromPath.rewrittenPathname;
      }
    }
    event.locals.organizationId = orgId;
    event.locals.organizationSlug = orgSlug;

    const response = await svelteKitHandler({ event, resolve, auth, building });
    const durationMs = Date.now() - startedAt;
    const context = buildRequestLogContext(event, orgId, session?.user?.id ?? null);

    if (response.status >= 500) {
      logRequest('error', 'Request failed', {
        ...context,
        status: response.status,
        durationMs
      });
    } else if (response.status >= 400) {
      logRequest('warn', 'Request completed with client error', {
        ...context,
        status: response.status,
        durationMs
      });
    } else {
      logRequest('info', 'Request completed', {
        ...context,
        status: response.status,
        durationMs
      });
    }

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const context = buildRequestLogContext(event, orgId, event.locals.user?.id ?? null);

    logRequest('error', 'Request crashed', {
      ...context,
      durationMs,
      error: error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
};
