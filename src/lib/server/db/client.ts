import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getDatabaseUrl } from '../services/env';
import * as schema from './schema';

const connectionString = getDatabaseUrl();

export const pool = new Pool({
  connectionString,
  max: 20
});

export const db = drizzle(pool, { schema });

export type DbClient = typeof db;
export type DbTransaction = Parameters<DbClient['transaction']>[0] extends (
  tx: infer T
) => Promise<unknown>
  ? T
  : never;

export async function withTransaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T> {
  return db.transaction(fn);
}
