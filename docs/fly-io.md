# Fly.io Deployment

This project is ready for Fly deployment with:
- `web` process (`node build`)
- `worker` process (`npm run worker`)
- release-time DB migrations (`npm run db:migrate`)

## Files
- `Dockerfile`
- `.dockerignore`
- `fly.toml`

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

## 3. Set required secrets

```bash
fly secrets set \
  DATABASE_URL="postgres://..." \
  REDIS_URL="redis://..." \
  DEFAULT_ORG_ID="00000000-0000-0000-0000-000000000001" \
  BETTER_AUTH_URL="https://console.haveri.app" \
  BETTER_AUTH_SECRET="<long-random-secret>" \
  BETTER_AUTH_TRUSTED_ORIGINS="https://console.haveri.app" \
  TEAMS_APP_BASE_URL="https://console.haveri.app" \
  TEAMS_TENANT_ID="<tenant-guid>" \
  TEAMS_CLIENT_ID="<client-guid>" \
  TEAMS_CLIENT_SECRET="<client-secret>" \
  TEAMS_INCIDENT_TEAM_ID="<team-guid>" \
  TEAMS_GLOBAL_INCIDENT_CHANNEL="teams|<team-guid>|<channel-id>" \
  TEAMS_MANIFEST_APP_ID="<app-guid>" \
  TEAMS_BOT_APP_ID="<bot-guid>"
```

## 4. Deploy

```bash
fly deploy
```

The `release_command` in `fly.toml` runs migrations on each deploy.

## 5. Scale process groups

```bash
fly scale count web=1 worker=1
```

Scale worker independently when needed:

```bash
fly scale count worker=2
```

## 6. Logs and checks

```bash
fly status
fly logs
fly checks list
```

## Notes
- Webhook endpoint for Teams bot: `https://<your-domain>/api/chat/teams/webhook`.
- If using Supabase/Postgres SSL, include SSL params in `DATABASE_URL`.
- The runtime image intentionally includes `tsx` because worker and migration entrypoints are TypeScript scripts.
