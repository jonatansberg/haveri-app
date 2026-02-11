import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq, sql } from 'drizzle-orm';
import { db, pool } from './client';
import { schemaMigrations } from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations(): Promise<void> {
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  );

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const existing = await db
      .select({ version: schemaMigrations.version })
      .from(schemaMigrations)
      .where(eq(schemaMigrations.version, file))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    const sqlFile = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await db.execute(sql.raw(sqlFile));
    await db.insert(schemaMigrations).values({ version: file });
    console.log(`Applied migration: ${file}`);
  }
}

runMigrations()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
