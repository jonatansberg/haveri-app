import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildTeamsAppPackageConfigFromEnv,
  buildTeamsManifest,
  validateTeamsAppPackageConfig
} from '../app-package';

const APP_PACKAGE_DIR = path.resolve('appPackage');
const MANIFEST_PATH = path.join(APP_PACKAGE_DIR, 'manifest.json');

async function main(): Promise<void> {
  const config = buildTeamsAppPackageConfigFromEnv(process.env);
  const errors = validateTeamsAppPackageConfig(config);

  if (errors.length > 0) {
    throw new Error(`Teams app package configuration is invalid:\n- ${errors.join('\n- ')}`);
  }

  const manifest = buildTeamsManifest(config);

  await fs.mkdir(APP_PACKAGE_DIR, { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('Wrote Teams manifest:', MANIFEST_PATH);
  console.log('Bot ID:', config.botId);
  console.log('Manifest ID:', config.manifestId);
  console.log('Base URL:', config.baseUrl);
  console.log('Valid domains:', config.validDomains.join(', '));
  console.log('Next: zip appPackage with manifest.json + color.png + outline.png for Teams sideload.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
