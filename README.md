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
2. Install dependencies:
   - `npm install`
3. Run migrations and seed:
   - `npm run db:migrate`
   - `npm run db:seed`
4. Start app:
   - `npm run dev`
5. Start escalation worker in another terminal:
   - `npm run worker`

## Managed Postgres (Fly/Supabase)
- Set `DATABASE_URL` to your managed PostgreSQL connection string.
- Run migrations once in the target environment: `npm run db:migrate`.
- Seed optional bootstrap data with `npm run db:seed`.

## Fly.io Deployment
- Deployment files are included:
  - `Dockerfile`
  - `.dockerignore`
  - `fly.toml`
- Full runbook: `docs/fly-io.md`

## Incident Workflow (MVP Static v1)
- `Responsible Lead` is required on every incident.
- `Comms Lead` is optional and can be assigned later.
- Teams incident declaration creates a dedicated incident channel.
- A global incident announcement card is posted to a configurable Teams channel and updated as incident state changes.
- Workflow rules are static today (`v1-static`) and intended to become configuration-driven later.

## Teams Config
- `TEAMS_GLOBAL_INCIDENT_CHANNEL`: default global announcement channel reference.
- `TEAMS_INCIDENT_CHANNEL_PREFIX`: prefix for generated incident channel names.
- `TEAMS_INCIDENT_TEAM_ID`: Teams team id where incident channels are created.
- `TEAMS_TENANT_ID` / `TEAMS_CLIENT_ID` / `TEAMS_CLIENT_SECRET`: Graph client-credentials auth for channel/message operations.
- `TEAMS_DELEGATED_ACCESS_TOKEN`: optional override token for local/debug use (takes precedence over client credentials).
- `TEAMS_GRAPH_BASE_URL_ROOT`: Graph root URL override for sovereign clouds.
- `TEAMS_APP_BASE_URL`: public HTTPS URL used for Teams bot webhook and manifest generation.
- `TEAMS_MANIFEST_APP_ID`: Teams app manifest id (GUID).
- `TEAMS_BOT_APP_ID`: bot app id (GUID) used in Teams manifest.

Channel reference formats accepted for `TEAMS_GLOBAL_INCIDENT_CHANNEL`:
- `<channelId>` (uses `TEAMS_INCIDENT_TEAM_ID`)
- `<teamId>/<channelId>`
- `teams|<teamId>|<channelId>`

Teams packaging scripts:
- `npm run teams:check` prints a tenant-tailored E2E checklist.
- `npm run teams:build-package` generates `teams/appPackage/manifest.json` from env.
- `npm run teams:zip-package` builds `teams/haveri-teams-app.zip` for Teams sideload.
- Full setup guide: `docs/teams-e2e.md`

## Verification
- Run full quality gate:
  - `npm run verify`
- Run coverage for incident/chat workflow modules:
  - `npm run test:coverage`

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
- Incident global announcement updates attempt in-place message patch first. If Graph app permissions block patch, Haveri posts a replacement card and persists the new message ref.
