import {
  buildTeamsAppPackageConfigFromEnv,
  validateTeamsAppPackageConfig
} from '../app-package';

function toChecklist(config: ReturnType<typeof buildTeamsAppPackageConfigFromEnv>): string {
  const normalizedBaseUrl = config.baseUrl.replace(/\/$/, '');
  const webhookUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/api/chat/teams/webhook`
    : '(set TEAMS_APP_BASE_URL)/api/chat/teams/webhook';
  const globalChannel = process.env['TEAMS_GLOBAL_INCIDENT_CHANNEL'] ?? '(set TEAMS_GLOBAL_INCIDENT_CHANNEL)';
  const incidentTeam = process.env['TEAMS_INCIDENT_TEAM_ID'] ?? '(set TEAMS_INCIDENT_TEAM_ID)';

  return [
    '# Teams E2E Checklist (Tenant-tailored)',
    '',
    '## Resolved Settings',
    `- Manifest App ID: ${config.manifestId}`,
    `- Bot App ID: ${config.botId}`,
    `- Base URL: ${config.baseUrl || '(set TEAMS_APP_BASE_URL)'}`,
    `- Webhook URL: ${webhookUrl}`,
    `- Incident Team ID: ${incidentTeam}`,
    `- Global Incident Channel Ref: ${globalChannel}`,
    `- Valid Domains: ${config.validDomains.join(', ')}`,
    '',
    '## Azure/Entra Setup',
    `1. Ensure Entra app registration exists for bot id \`${config.botId}\`.`,
    '2. Ensure Bot Channel Registration is connected to that app registration.',
    `3. Set the messaging endpoint to \`${webhookUrl}\`.`,
    '4. Grant Graph permissions used for channel lifecycle operations (for example create/archive channel, add channel members) and grant consent.',
    '',
    '## Haveri Setup',
    '1. Set Teams env vars in `console/.env` (see `console/.env.example`).',
    '2. Run `pnpm teams:build-package` to generate `integrations/teams/appPackage/manifest.json`.',
    '3. Ensure `integrations/teams/appPackage/color.png` (192x192) and `integrations/teams/appPackage/outline.png` (32x32) exist.',
    '4. Zip `manifest.json`, `color.png`, `outline.png` into one package file.',
    '',
    '## Teams Client Setup',
    '1. In Teams, open Apps > Manage your apps > Upload an app.',
    '2. Upload the generated zip package and add it to your test team.',
    '3. Add the bot to the team where incidents are declared.',
    '',
    '## E2E Test Flow',
    '1. Send `/incident SEV2 Packaging line unstable` in the team channel.',
    '2. Confirm Haveri creates a dedicated incident channel.',
    '3. Confirm a global incident card is posted to the configured global channel.',
    '4. Send `/status <incidentId> MITIGATED` and verify global card updates.',
    '5. Send `/resolve <incidentId> Restarted and verified output` and verify status sync.',
    '6. Send `/ack <incidentId>` and confirm escalation acknowledgment is reflected.',
    '',
    '## Debugging',
    '- If channel creation fails: verify TEAMS_INCIDENT_TEAM_ID and Graph Channel.Create permission.',
    '- If global card post/update fails: verify TEAMS_BOT_APP_ID / bot secret / bot service URL and that the bot is installed in the target team/channel.',
    '- If commands are ignored: ensure webhook receives Teams activities and bot is installed in team scope.'
  ].join('\n');
}

function main(): void {
  const config = buildTeamsAppPackageConfigFromEnv(process.env);
  const errors = validateTeamsAppPackageConfig(config);

  if (errors.length > 0) {
    console.warn('Configuration warnings:');
    for (const error of errors) {
      console.warn(`- ${error}`);
    }
    console.warn('');
  }

  console.log(toChecklist(config));
}

main();
