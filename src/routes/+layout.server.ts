import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const authRoutes = new Set(['/login', '/register']);

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isAuthRoute = authRoutes.has(url.pathname);

  if (!locals.user && !isAuthRoute) {
    throw redirect(303, '/login');
  }

  if (locals.user && isAuthRoute) {
    throw redirect(303, '/');
  }

  return {
    user: locals.user,
    session: locals.session,
    organizationId: locals.organizationId,
    organizationSlug: locals.organizationSlug
  };
};
