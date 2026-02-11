import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('migration 012 follow_up_reminder_log', () => {
  it('creates follow-up reminder log table and index', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/server/db/migrations/012_follow_up_reminder_log.sql'),
      'utf8'
    );

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS follow_up_reminder_log');
    expect(sql).toContain('UNIQUE (follow_up_id, reminder_type, reminder_date)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_follow_up_reminder_log_org_date');
  });
});
