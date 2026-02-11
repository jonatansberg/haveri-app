import { redirect } from '@sveltejs/kit';
import { getPlausibleDomain } from '$lib/server/services/env';
import type { LayoutServerLoad } from './$types';

const authRoutes = new Set(['/login', '/register']);

function isPublicRoute(pathname: string): boolean {
  if (authRoutes.has(pathname)) {
    return true;
  }

  if (pathname === '/about' || pathname === '/contact' || pathname === '/landing') {
    return true;
  }

  if (pathname === '/blog' || pathname.startsWith('/blog/')) {
    return true;
  }

  return false;
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isAuthRoute = authRoutes.has(url.pathname);
  const isPublic = isPublicRoute(url.pathname);

  if (!locals.user && !isPublic) {
    throw redirect(303, '/login');
  }

  if (locals.user && isAuthRoute) {
    throw redirect(303, '/');
  }

  return {
    user: locals.user,
    session: locals.session,
    organizationId: locals.organizationId,
    organizationSlug: locals.organizationSlug,
    plausibleDomain: getPlausibleDomain()
  };
};
