# Fly.io Deployment

This project is ready for Fly deployment with:
- `web` process (`node build`)
- `worker` process (`npm run worker`)
- release-time DB migrations (`npm run db:migrate`)
- unmanaged Redis on Fly (separate Redis app)

## Files
- `Dockerfile`
- `.dockerignore`
- `fly.toml`
- `fly.redis.toml`

## 1. Install and authenticate Fly CLI

```bash
brew install flyctl
fly auth login
```

## 2. Create app (first time)

If `haveri-console` is unavailable, pick another name and update `app` in `fly.toml`.

```bash
fly apps create haveri-console
```

## 3. Provision unmanaged Redis app

Create a dedicated Fly app for Redis:

```bash
fly apps create haveri-redis
```

Create persistent storage:

```bash
fly volumes create redis_data --app haveri-redis --region fra --size 3
```

Set Redis password:

```bash
fly secrets set --app haveri-redis REDIS_PASSWORD="<strong-random-password>"
```

Deploy Redis using included config:

```bash
fly deploy -c fly.redis.toml --app haveri-redis
```

Set `REDIS_URL` in the Haveri app:

```bash
fly secrets set REDIS_URL="redis://:<strong-random-password>@haveri-redis.internal:6379"
```

## 4. Set required app secrets

```bash
fly secrets set \
  DATABASE_URL="postgres://..." \
  DEFAULT_ORG_ID="00000000-0000-0000-0000-000000000001" \
  BETTER_AUTH_URL="https://console.haveri.app" \
  BETTER_AUTH_SECRET="<long-random-secret>" \
  BETTER_AUTH_TRUSTED_ORIGINS="https://console.haveri.app" \
  TEAMS_TENANT_ID="<tenant-guid>" \
  TEAMS_CLIENT_ID="<client-guid>" \
  TEAMS_CLIENT_SECRET="<client-secret>" \
  TEAMS_BOT_APP_ID="<bot-app-guid>" \
  TEAMS_BOT_CLIENT_SECRET="<bot-client-secret-if-different>" \
  TEAMS_BOT_SERVICE_URL="https://smba.trafficmanager.net/teams" \
  TEAMS_INCIDENT_TEAM_ID="<team-guid>" \
  TEAMS_GLOBAL_INCIDENT_CHANNEL="teams|<team-guid>|<channel-id>"
```

## 5. Deploy app

```bash
fly deploy
```

The `release_command` in `fly.toml` runs migrations on each deploy.

## 6. Scale process groups

```bash
fly scale count web=1 worker=1
```

Scale worker independently when needed:

```bash
fly scale count worker=2
```

## 7. Logs and checks

```bash
fly status
fly logs
fly checks list
```

## Notes
- Webhook endpoint for Teams bot: `https://<your-domain>/api/chat/teams/webhook`.
- If using Supabase/Postgres SSL, include SSL params in `DATABASE_URL`.
- The runtime image intentionally includes `tsx` because worker and migration entrypoints are TypeScript scripts.
- Redis operations:
  - `fly status --app haveri-redis`
  - `fly logs --app haveri-redis`
  - `fly ssh console --app haveri-redis`
