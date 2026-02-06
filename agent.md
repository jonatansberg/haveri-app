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
- MVP implementation complete across backend, chat adapter, queue worker, and web UI.
- Implemented:
  - Better Auth + protected SvelteKit app/API routes.
  - Event-sourced incident lifecycle services + projection updates.
  - Incident, follow-up, escalation APIs.
  - Teams webhook adapter with idempotency and command parsing.
  - BullMQ-based escalation scheduler + worker.
  - Dashboard + incident detail timeline UI and action forms.
  - Setup/ops/command-event docs.

## Decisions
- DB: Drizzle ORM over PostgreSQL.
- Runtime: SvelteKit + Node adapter.
- Queue: BullMQ + Redis worker process.
- Auth: Better Auth email/password for MVP.
- Multi-tenant context: `organizationId` from `x-org-id` header, default `DEFAULT_ORG_ID`.

## Verification Snapshot
- Last full verify run: PASS (`check`, `lint`, `test`) after UI + docs updates.

## Remaining
- None for MVP scope; ready for user validation and runtime testing with real Postgres/Redis and Teams payloads.
