import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('migration 013 marketing leads', () => {
  it('creates marketing_leads table and index', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/server/db/migrations/013_marketing_leads.sql'),
      'utf8'
    );

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketing_leads');
    expect(sql).toContain('lead_type TEXT NOT NULL');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_marketing_leads_type_created');
  });
});
