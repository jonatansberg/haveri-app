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
- Keep a clear incident workflow with static role structure for now.
- On incident creation, create incident channel + post/update a global incident channel card.

## Current Status
- MVP implementation completed and currently being refined with incident workflow/channel sync behavior.
- Implemented:
  - Better Auth + protected SvelteKit app/API routes.
  - Event-sourced incident lifecycle services + projection updates.
  - Incident, follow-up, escalation APIs.
  - Teams webhook adapter with idempotency and command parsing.
  - Static incident workflow (`v1-static`): required responsible lead + optional comms lead.
  - Organization chat settings + configurable global incident channel reference.
  - Teams incident channel creation placeholder + global incident card post/update placeholder.
  - Dashboard + incident detail UI for responsible/comms assignment and workflow state visibility.

## Decisions
- DB: Drizzle ORM over PostgreSQL.
- Runtime: SvelteKit + Node adapter.
- Queue: BullMQ + Redis worker process.
- Auth: Better Auth email/password for MVP.
- Multi-tenant context: `organizationId` from `x-org-id` header, default `DEFAULT_ORG_ID`.

## Verification Snapshot
- Last full verify run: PASS (`check`, `lint`, `test`) after workflow/channel updates.

## Remaining
- Wire placeholder Teams channel/card operations to real Teams APIs.
- Add deeper integration tests around incident workflow + global announcement synchronization.
