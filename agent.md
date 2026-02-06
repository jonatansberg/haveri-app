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
- Baseline scaffold complete.
- Better Auth integration complete.
- Incident + follow-up services and APIs complete.
- Teams adapter slice complete:
  - Teams command parser (`/incident`, `/status`, `/resolve`, `/ack`).
  - Public Teams webhook endpoint with idempotency persistence.
  - Channel-message capture into incident timeline events.
- Escalation queue slice complete:
  - BullMQ queue + scheduler + worker.
  - Policy selection from configured escalation policies.
  - Step execution recorded as `escalation` events.
- Next in progress: dashboard/timeline web UI and docs polish.

## Decisions
- DB: Drizzle ORM over PostgreSQL.
- Runtime: SvelteKit + Node adapter.
- Queue: BullMQ + Redis (`worker` script runs escalation processor).
- Auth: Better Auth with email/password for MVP.
- Multi-tenant context: `organizationId` resolved from `x-org-id` header, defaulting to `DEFAULT_ORG_ID`.

## Verification Snapshot
- Last full verify run: PASS (`check`, `lint`, `test`) with parser tests and state-machine tests passing.

## Next Actions
1. Build dashboard list view against `/api/incidents`.
2. Build incident detail timeline page with status/severity/resolve/close actions.
3. Add follow-up management UI.
4. Update architecture/setup docs with implemented endpoints, worker flow, and run instructions.
5. Final full verify and final commit(s).
