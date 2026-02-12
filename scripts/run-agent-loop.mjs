#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseEnvFile(content) {
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1));
    entries[key] = value;
  }

  return entries;
}

function loadLoopEnv() {
  const envCandidates = [path.join(ROOT, 'console', '.env'), path.join(ROOT, '.env')];

  for (const candidate of envCandidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    const content = fs.readFileSync(candidate, 'utf8');
    return parseEnvFile(content);
  }

  throw new Error('Missing console/.env or ./.env (DATABASE_URL required).');
}

function runCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      env
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function main() {
  await runCommand('pnpm', ['--filter', '@haveri/console', 'test'], process.env);
  const loopEnv = loadLoopEnv();
  await runCommand(
    'pnpm',
    ['--filter', '@haveri/console', 'test:e2e', '--project', 'public'],
    { ...process.env, ...loopEnv }
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
