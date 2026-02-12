# Teams E2E Setup

This project includes a Teams app-package generator and a tenant-tailored checklist so you can run end-to-end incident workflows in Microsoft Teams.

## 1. Configure environment

Set runtime values in `console/.env`:

- `TEAMS_INCIDENT_TEAM_ID`: Team id where incident channels are created.
- `TEAMS_GLOBAL_INCIDENT_CHANNEL`: Global channel reference. Preferred formats:
  - `teams|<teamId>|<channelId>`
  - `<teamId>/<channelId>`
  - `<channelId>` (uses `TEAMS_INCIDENT_TEAM_ID`)
- `TEAMS_TENANT_ID`, `TEAMS_CLIENT_ID`, `TEAMS_CLIENT_SECRET`: Graph auth for channel lifecycle operations (channel create/member management/archive).
- `TEAMS_BOT_APP_ID`: Bot App ID used for webhook token audience validation and proactive bot messaging.
- `TEAMS_BOT_CLIENT_SECRET` (optional): Bot secret override. Falls back to `TEAMS_CLIENT_SECRET`.
- `TEAMS_BOT_SERVICE_URL` (optional): Bot Connector service URL for proactive posts. Default: `https://smba.trafficmanager.net/teams`.

Set manifest-generation values in `integrations/teams/.env.teams-package` (copy from `integrations/teams/.env.teams-package.example`):

- `TEAMS_APP_BASE_URL`: Public HTTPS URL for your running Haveri app (for example, your Fly URL or dev tunnel URL).
- `TEAMS_MANIFEST_APP_ID`: Teams app manifest id (GUID).
- `TEAMS_BOT_APP_ID`: Entra/Bot app id used by the Teams bot (GUID).
- Other `TEAMS_APP_*` metadata fields.

### Local tunnel loop (stable hostname)

Use a named Cloudflare tunnel with a fixed hostname so Teams app installs stay stable.

Prerequisite: `cloudflared` must be installed and available on your PATH.

One-time setup:

1. Authenticate and create named tunnel:

```bash
cloudflared tunnel login
cloudflared tunnel create haveri-dev
```

2. Route a stable hostname (replace with your domain):

```bash
cloudflared tunnel route dns haveri-dev teams-dev.your-domain.com
```

3. Create `~/.cloudflared/config.yml`:

```yaml
tunnel: haveri-dev
ingress:
  - hostname: teams-dev.your-domain.com
    service: http://localhost:5173
  - service: http_status:404
```

Daily dev loop:

1. Start app locally:

```bash
pnpm dev
```

2. Start tunnel in a second terminal:

```bash
cloudflared tunnel run haveri-dev
```

3. Sync Teams env values with the stable URL:

```bash
pnpm teams:sync-tunnel -- https://teams-dev.your-domain.com
```

4. Build/zip once for first install (and again only if manifest metadata changes):

```bash
pnpm teams:build-package
pnpm teams:zip-package
```

With a stable hostname you usually do not need to reinstall the app on each restart.

## 2. Generate checklist for your tenant

```bash
pnpm teams:check
```

This prints a concrete checklist using your current env values, including the exact webhook URL.

## 3. Generate Teams manifest

```bash
pnpm teams:build-package
```

This writes `integrations/teams/appPackage/manifest.json`.

## 4. Ensure package icons exist

The app package must include:

- `integrations/teams/appPackage/color.png` (192x192)
- `integrations/teams/appPackage/outline.png` (32x32)

Repo note:
- Placeholder icons are already included for local testing. Replace them with brand assets before production rollout.

## 5. Zip and upload app package

```bash
pnpm teams:zip-package
```

Then upload `integrations/teams/haveri-teams-app.zip` in Teams (`Apps -> Manage your apps -> Upload an app`).

## 6. Bot endpoint

Set the Azure Bot Channel Registration messaging endpoint to:

- `<TEAMS_APP_BASE_URL>/api/chat/teams/webhook`

## 7. Validate E2E flow

In a team channel where the bot is installed, run:

1. `/incident SEV2 Packaging line unstable`
2. `/status <incidentId> MITIGATED`
3. `/resolve <incidentId> Restarted and verified output`
4. `/ack <incidentId>`

Expected behavior:

- Dedicated incident channel is created.
- Global incident announcement card is posted.
- Global card updates with status/resolve/ack actions.

## Reference Docs

- [Teams AI quickstart (TypeScript)](https://learn.microsoft.com/en-us/microsoftteams/platform/teams-ai-library/getting-started/quickstart?pivots=typescript)
- [Teams AI code basics (TypeScript)](https://learn.microsoft.com/en-us/microsoftteams/platform/teams-ai-library/getting-started/code-basics?tabs=controller&pivots=typescript)
- [Run Teams AI app in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/teams-ai-library/getting-started/running-in-teams/overview?pivots=typescript)
- [Adaptive cards in Teams AI library](https://learn.microsoft.com/en-us/microsoftteams/platform/teams-ai-library/in-depth-guides/adaptive-cards/building-adaptive-cards?tabs=controller&pivots=typescript)
- [Upload custom apps in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload)
