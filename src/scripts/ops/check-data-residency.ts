import fs from 'node:fs';
import path from 'node:path';

const EU_FLY_REGIONS = new Set(['ams', 'arn', 'cdg', 'fra', 'lhr', 'mad', 'otp', 'waw']);

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message: string): void {
  console.log(`OK: ${message}`);
}

function isLikelyEuDatabaseHost(databaseUrl: string): boolean {
  const lower = databaseUrl.toLowerCase();
  return (
    lower.includes('eu-') ||
    lower.includes('-eu') ||
    lower.includes('.eu.') ||
    lower.includes('westeurope') ||
    lower.includes('northeurope')
  );
}

function isLikelyEuStorageRegion(region: string): boolean {
  const normalized = region.trim().toLowerCase();
  return normalized.startsWith('eu') || normalized.includes('europe');
}

const flyTomlPath = path.join(process.cwd(), 'fly.toml');
if (!fs.existsSync(flyTomlPath)) {
  fail('fly.toml not found');
}

const flyToml = fs.readFileSync(flyTomlPath, 'utf8');
const regionMatch = /primary_region\s*=\s*"([a-z0-9-]+)"/i.exec(flyToml);
if (!regionMatch?.[1]) {
  fail('primary_region is missing in fly.toml');
}
if (!EU_FLY_REGIONS.has(regionMatch[1].toLowerCase())) {
  fail(`primary_region must be EU. Found: ${regionMatch[1]}`);
}
ok(`Fly primary region is EU (${regionMatch[1]})`);

const databaseUrl = process.env['DATABASE_URL'] ?? '';
if (!databaseUrl) {
  fail('DATABASE_URL is required to validate DB residency');
}
if (!isLikelyEuDatabaseHost(databaseUrl)) {
  fail('DATABASE_URL host does not appear to be EU-resident');
}
ok('DATABASE_URL appears EU-resident');

const storageRegion =
  process.env['AZURE_STORAGE_REGION'] ??
  process.env['S3_REGION'] ??
  process.env['BLOB_STORAGE_REGION'] ??
  '';
if (!storageRegion) {
  fail('Set AZURE_STORAGE_REGION, S3_REGION, or BLOB_STORAGE_REGION to validate blob residency');
}
if (!isLikelyEuStorageRegion(storageRegion)) {
  fail(`Storage region must be EU. Found: ${storageRegion}`);
}
ok(`Blob storage region appears EU-resident (${storageRegion})`);

console.log('Data residency validation passed.');
