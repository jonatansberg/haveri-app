# Haveri MVP

Chat-native incident management MVP built with SvelteKit, Drizzle/PostgreSQL, Better Auth, and BullMQ.

## Stack
- SvelteKit (Node adapter)
- TypeScript (strict)
- Drizzle ORM + PostgreSQL
- Better Auth (email/password)
- BullMQ + Redis (escalation jobs)

## Local Setup
1. Copy `.env.example` to `.env` and set values.
2. Optional for Teams manifest packaging: copy `integrations/teams/.env.teams-package.example` to `integrations/teams/.env.teams-package`.
3. Install dependencies:
   - `pnpm install` (run from repo root)
4. Run migrations and seed:
   - `pnpm db:migrate`
   - `pnpm db:seed`
5. Start app:
   - `pnpm dev`
6. Start escalation worker in another terminal:
   - `pnpm worker`

## Managed Postgres (Fly/Supabase)
- Set `DATABASE_URL` to your managed PostgreSQL connection string.
- Run migrations once in the target environment: `pnpm db:migrate`.
- Seed optional bootstrap data with `pnpm db:seed`.

## Fly.io Deployment
- Deployment files are included:
  - `Dockerfile`
  - `.dockerignore`
  - `fly.toml`
- Redis for BullMQ is expected to run as an unmanaged Redis app on Fly (`fly.redis.toml`) and injected as `REDIS_URL`.
- Full runbook: `docs/fly-io.md`

## Incident Workflow (MVP Static v1)
- `Responsible Lead` is required on every incident.
- `Comms Lead` is optional and can be assigned later.
- Teams incident declaration creates a dedicated incident channel.
- A global incident announcement card is posted to a configurable Teams channel and updated as incident state changes.
- Workflow rules are static today (`v1-static`) and intended to become configuration-driven later.

## Teams Config
Runtime-only variables (used by server/worker while app is running):
- `TEAMS_GLOBAL_INCIDENT_CHANNEL`: default global announcement channel reference.
- `TEAMS_INCIDENT_CHANNEL_PREFIX`: prefix for generated incident channel names.
- `TEAMS_INCIDENT_TEAM_ID`: Teams team id where incident channels are created.
- `TEAMS_TENANT_ID` / `TEAMS_CLIENT_ID` / `TEAMS_CLIENT_SECRET`: Graph client-credentials auth for channel/message operations.
- `TEAMS_DELEGATED_ACCESS_TOKEN`: optional override token for local/debug use (takes precedence over client credentials).
- `TEAMS_GRAPH_BASE_URL_ROOT`: Graph root URL override for sovereign clouds.

Tooling-only variables (manifest generation only, not required at runtime):
- `TEAMS_APP_BASE_URL`, `TEAMS_MANIFEST_APP_ID`, `TEAMS_BOT_APP_ID`, and other `TEAMS_APP_*` metadata.
- Put these in `integrations/teams/.env.teams-package` (see `integrations/teams/.env.teams-package.example`) to keep runtime `console/.env` minimal.

Channel reference formats accepted for `TEAMS_GLOBAL_INCIDENT_CHANNEL`:
- `<channelId>` (uses `TEAMS_INCIDENT_TEAM_ID`)
- `<teamId>/<channelId>`
- `teams|<teamId>|<channelId>`

Teams packaging scripts:
- `pnpm teams:check` prints a tenant-tailored E2E checklist.
- `pnpm teams:build-package` generates `integrations/teams/appPackage/manifest.json` from env.
- `pnpm teams:sync-tunnel -- https://<stable-hostname>` updates `integrations/teams/.env.teams-package` for local tunnel testing.
- `pnpm teams:zip-package` builds `integrations/teams/haveri-teams-app.zip` for Teams sideload.
- Full setup guide: `docs/teams-e2e.md`

## Verification
- Run full quality gate:
  - `pnpm verify`
- Run coverage for incident/chat workflow modules:
  - `pnpm --filter @haveri/console test:coverage`

## Key API Endpoints
- `POST /api/chat/teams/webhook`
- `GET /api/incidents`
- `POST /api/incidents`
- `GET /api/incidents/:id`
- `POST /api/incidents/:id/status`
- `POST /api/incidents/:id/severity`
- `POST /api/incidents/:id/assign`
- `POST /api/incidents/:id/comms`
- `POST /api/incidents/:id/resolve`
- `POST /api/incidents/:id/close`
- `POST /api/incidents/:id/ack`
- `GET /api/followups`
- `PATCH /api/followups`

## Auth
- Better Auth endpoints are mounted under `/api/auth`.
- Use `/register` then `/login` in the web UI.

## Teams Notes
- `POST /api/chat/teams/webhook` accepts both:
  - Existing simplified payloads (`{ id, type, text, channelId, userId, ... }`)
  - Native Teams/Bot activity payloads (`from`, `conversation`, `channelData`, etc.)
- Non-message bot activities (for example `conversationUpdate`) are acknowledged and ignored to prevent webhook retries.
- Incident/global card delivery uses Bot Framework proactive messaging first (works without user interaction), with Graph fallback where available.
