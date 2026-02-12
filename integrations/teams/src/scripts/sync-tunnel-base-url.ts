import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildTeamsTunnelEnvUpdates,
  normalizeHttpsBaseUrl,
  readEnvValue,
  upsertEnvContent
} from '../dev-tunnel';

const ENV_FILE_PATH = path.resolve('.env.teams-package');
const ENV_EXAMPLE_PATH = path.resolve('.env.teams-package.example');

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadEnvFile(): Promise<string> {
  const envExists = await fileExists(ENV_FILE_PATH);
  if (envExists) {
    return fs.readFile(ENV_FILE_PATH, 'utf8');
  }

  const exampleExists = await fileExists(ENV_EXAMPLE_PATH);
  if (!exampleExists) {
    throw new Error(`Missing template file: ${ENV_EXAMPLE_PATH}`);
  }

  const exampleContent = await fs.readFile(ENV_EXAMPLE_PATH, 'utf8');
  await fs.writeFile(ENV_FILE_PATH, exampleContent, 'utf8');
  return exampleContent;
}

async function main(): Promise<void> {
  const rawBaseUrl = process.argv.slice(2).find((entry) => entry !== '--');
  if (!rawBaseUrl) {
    throw new Error('Usage: pnpm teams:sync-tunnel -- https://<stable-tunnel-hostname>');
  }

  const baseUrl = normalizeHttpsBaseUrl(rawBaseUrl);

  const currentEnv = await loadEnvFile();
  const existingDomains = readEnvValue(currentEnv, 'TEAMS_APP_VALID_DOMAINS');
  const updates = buildTeamsTunnelEnvUpdates(baseUrl, existingDomains);
  const nextEnv = upsertEnvContent(currentEnv, updates);

  await fs.writeFile(ENV_FILE_PATH, nextEnv, 'utf8');

  console.log(`Updated ${ENV_FILE_PATH}`);
  console.log(`TEAMS_APP_BASE_URL=${baseUrl}`);
  console.log(`Webhook URL: ${baseUrl}/api/chat/teams/webhook`);
  console.log('Next steps: pnpm teams:build-package && pnpm teams:zip-package');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
