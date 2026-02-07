# Teams E2E Setup

This project includes a Teams app-package generator and a tenant-tailored checklist so you can run end-to-end incident workflows in Microsoft Teams.

## 1. Configure environment

Set runtime values in `.env`:

- `TEAMS_INCIDENT_TEAM_ID`: Team id where incident channels are created.
- `TEAMS_GLOBAL_INCIDENT_CHANNEL`: Global channel reference. Preferred formats:
  - `teams|<teamId>|<channelId>`
  - `<teamId>/<channelId>`
  - `<channelId>` (uses `TEAMS_INCIDENT_TEAM_ID`)
- `TEAMS_TENANT_ID`, `TEAMS_CLIENT_ID`, `TEAMS_CLIENT_SECRET`: Graph auth for channel/card operations.

Set manifest-generation values in `.env.teams-package` (copy from `.env.teams-package.example`):

- `TEAMS_APP_BASE_URL`: Public HTTPS URL for your running Haveri app (for example, your Fly URL or dev tunnel URL).
- `TEAMS_MANIFEST_APP_ID`: Teams app manifest id (GUID).
- `TEAMS_BOT_APP_ID`: Entra/Bot app id used by the Teams bot (GUID).
- Other `TEAMS_APP_*` metadata fields.

## 2. Generate checklist for your tenant

```bash
npm run teams:check
```

This prints a concrete checklist using your current env values, including the exact webhook URL.

## 3. Generate Teams manifest

```bash
npm run teams:build-package
```

This writes `teams/appPackage/manifest.json`.

## 4. Ensure package icons exist

The app package must include:

- `teams/appPackage/color.png` (192x192)
- `teams/appPackage/outline.png` (32x32)

Repo note:
- Placeholder icons are already included for local testing. Replace them with brand assets before production rollout.

## 5. Zip and upload app package

```bash
npm run teams:zip-package
```

Then upload `teams/haveri-teams-app.zip` in Teams (`Apps -> Manage your apps -> Upload an app`).

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
