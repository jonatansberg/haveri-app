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
- MVP implementation completed and incident workflow/channel sync behavior now has expanded automated coverage.
- Implemented:
  - Better Auth + protected SvelteKit app/API routes.
  - Event-sourced incident lifecycle services + projection updates.
  - Incident, follow-up, escalation APIs.
  - Teams webhook adapter with idempotency, command parsing, and native Teams activity payload normalization.
  - Static incident workflow (`v1-static`): required responsible lead + optional comms lead.
  - Organization chat settings + configurable global incident channel reference.
  - Teams Graph SDK integration for incident channel creation and global adaptive card post/update.
  - Global incident announcement update fallback: post replacement card when Graph patch is restricted.
  - Teams app package tooling: env-driven manifest generator, placeholder icons, zip command, and tenant-tailored E2E checklist output.
  - Runtime env cleanup: server auth + shared server env getters now read SvelteKit dynamic private env first, with `process.env` fallback, and env examples are split into runtime vs manifest-tooling.
  - Auth UX hardening: sign-in/sign-up now use explicit `try/catch/finally` handling so thrown client/network errors surface in the UI and loading state is always reset.
  - Fly.io deployment baseline: production Dockerfile, process-group `fly.toml`, deployment runbook, and unmanaged Fly Redis app setup guidance.
  - Dashboard + incident detail UI for responsible/comms assignment and workflow state visibility.
  - Test coverage pass with unit + integration suites for parser, adapter, chat-ops, graph client, workflow service, and incident API routes.

## Decisions
- DB: Drizzle ORM over PostgreSQL.
- Runtime: SvelteKit + Node adapter.
- Queue: BullMQ + Redis worker process.
- Auth: Better Auth email/password for MVP.
- Multi-tenant context: `organizationId` from `x-org-id` header, default `DEFAULT_ORG_ID`.
- Documentation reference workflow: use Context7 MCP for official SDK/library docs and API examples.
- Code-reference workflow: use grep MCP to find in-repo usage examples and implementation patterns before adding new code.

## Verification Snapshot
- Last full verify run: PASS (`check`, `lint`, `test`) after auth sign-in/sign-up error-handling hardening.
- Last coverage run: PASS (`npm run test:coverage`) with thresholds enforced in `vitest.config.ts` for incident/chat workflow modules.

## Remaining
- Add deeper integration tests around incident workflow + global announcement synchronization against a live Teams sandbox tenant.
- Add integration tests that run against a real PostgreSQL test database for end-to-end event-store behavior.
- Add post-deploy smoke automation for Fly (release health check + webhook connectivity test).
