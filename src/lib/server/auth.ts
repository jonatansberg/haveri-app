import { getRequestEvent } from '$app/server';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db/client';
import { betterAuthSchema } from '$lib/server/db/schema';

const baseURL = process.env['BETTER_AUTH_URL'] ?? 'http://localhost:5173';
const trustedOrigins = process.env['BETTER_AUTH_TRUSTED_ORIGINS']
  ?.split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0) ?? [baseURL];

export const auth = betterAuth({
  baseURL,
  basePath: '/api/auth',
  secret:
    process.env['BETTER_AUTH_SECRET'] ??
    'replace-this-in-production-with-a-long-random-secret-32-chars-minimum',
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: betterAuthSchema
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8
  },
  plugins: [sveltekitCookies(getRequestEvent)]
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession['user'];
export type AuthSessionData = AuthSession['session'];
