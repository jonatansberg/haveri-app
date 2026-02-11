import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db/client';
import { betterAuthSchema } from '$lib/server/db/schema';

const configuredBaseURL = env.BETTER_AUTH_URL?.trim();
const baseURL = dev ? undefined : configuredBaseURL;
const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS
  ?.split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0) ?? [];

export const auth = betterAuth({
  ...(baseURL ? { baseURL } : {}),
  basePath: '/api/auth',
  secret:
    env.BETTER_AUTH_SECRET ??
    'replace-this-in-production-with-a-long-random-secret-32-chars-minimum',
  ...(trustedOrigins.length > 0 ? { trustedOrigins } : {}),
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
