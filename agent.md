# Agent Log (Living)

## Purpose
Track implementation decisions, current progress, verification status, and next actions while building the Haveri MVP.

## User Requirements (Active)
- Build the full Phase 1 MVP end-to-end.
- Use Drizzle for DB access.
- Enforce strict TypeScript config.
- Run lint + tests continuously (Vitest).
- Commit incrementally as work progresses.
- Keep project docs updated as implementation evolves.
- Use Better Auth for authentication.
- Assume managed PostgreSQL (Fly or Supabase).

## Current Status
- Baseline scaffold complete (SvelteKit + Drizzle schema/migrations + strict TS + ESLint + Vitest).
- Better Auth dependencies aligned with Drizzle (`drizzle-orm@0.45.x`, `drizzle-kit@0.31.x`, `better-auth@1.4.x`).
- Better Auth integrated:
  - Drizzle auth tables in schema + SQL migration.
  - `src/lib/server/auth.ts` configured with Drizzle adapter and SvelteKit cookie plugin.
  - `src/hooks.server.ts` sets `locals.user/session` and protects non-public APIs.
  - Login/register pages added.
- Next in progress: event-sourced incident/follow-up/escalation services + API endpoints.

## Decisions
- DB: Drizzle ORM over PostgreSQL.
- Runtime: SvelteKit + Node adapter.
- Queue: BullMQ for escalation/reminder jobs.
- Auth: Better Auth with email/password for MVP.
- Multi-tenant context: `organizationId` resolved from `x-org-id` header, defaulting to `DEFAULT_ORG_ID`.

## Verification Snapshot
- Last full verify run: PASS (`check`, `lint`, `test`) after Better Auth integration.

## Next Actions
1. Implement incident service and event store with Drizzle transactions.
2. Add incident/follow-up API routes (auth protected).
3. Add Teams webhook command adapter with idempotency.
4. Implement BullMQ escalation scheduling + worker.
5. Build dashboard + incident detail timeline UI.
6. Re-run verify after each slice and commit in small increments.
