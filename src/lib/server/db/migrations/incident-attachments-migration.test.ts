import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('migration 009 incident attachments', () => {
  it('creates incident_attachments table and index', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/server/db/migrations/009_incident_attachments.sql'),
      'utf8'
    );

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS incident_attachments');
    expect(sql).toContain('storage_path TEXT NOT NULL');
    expect(sql).toContain('UNIQUE (organization_id, storage_path)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_incident_attachments_org_incident');
  });
});
