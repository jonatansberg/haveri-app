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
- Better Auth integration complete (hooks, locals, login/register, auth tables).
- Incident domain services complete for:
  - event append + projection updates,
  - declare/status/severity/assignment/resolve/close,
  - incident summary writes,
  - follow-up creation + status updates,
  - escalation acknowledgment runtime updates.
- API routes implemented for incidents and follow-ups.
- Next in progress: Teams adapter endpoints + command parsing + BullMQ escalation scheduling/worker.

## Decisions
- DB: Drizzle ORM over PostgreSQL.
- Runtime: SvelteKit + Node adapter.
- Queue: BullMQ for escalation/reminder jobs.
- Auth: Better Auth with email/password for MVP.
- Multi-tenant context: `organizationId` resolved from `x-org-id` header, defaulting to `DEFAULT_ORG_ID`.

## Verification Snapshot
- Last full verify run: PASS (`check`, `lint`, `test`) after incident service/API implementation.

## Next Actions
1. Implement Teams webhook adapter with idempotency and `/incident` + `/resolve` command parsing.
2. Add escalation scheduling (policy selection + queue jobs + worker processing).
3. Build dashboard/list/detail UI against the new APIs.
4. Add unit tests for command parsing and escalation condition matching.
5. Update architecture/setup docs to reflect implemented endpoints and runtime workflow.
