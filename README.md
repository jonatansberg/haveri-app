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

## Incident Workflow (MVP Static v1)
- `Responsible Lead` is required on every incident.
- `Comms Lead` is optional and can be assigned later.
- Teams incident declaration creates a dedicated incident channel.
- A global incident announcement card is posted to a configurable Teams channel and updated as incident state changes.
- Workflow rules are static today (`v1-static`) and intended to become configuration-driven later.

## Teams Config
- `TEAMS_GLOBAL_INCIDENT_CHANNEL`: default global announcement channel reference.
- `TEAMS_INCIDENT_CHANNEL_PREFIX`: prefix for generated incident channel names.

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
