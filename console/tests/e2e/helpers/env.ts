import fs from 'node:fs';
import path from 'node:path';

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function readEnvVar(key: string): string {
  const fromProcess = process.env[key];
  if (fromProcess && fromProcess.trim().length > 0) {
    return fromProcess;
  }

  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error(`${key} is required. Missing process env and .env file at ${envPath}`);
  }

  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const envKey = line.slice(0, separator).trim();
    if (envKey !== key) {
      continue;
    }

    return stripQuotes(line.slice(separator + 1));
  }

  throw new Error(`${key} is required but was not found in process env or .env`);
}
