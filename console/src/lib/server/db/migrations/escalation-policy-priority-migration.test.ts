import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('migration 010 escalation policy priority', () => {
  it('adds and backfills priority ordering for escalation policies', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/server/db/migrations/010_escalation_policy_priority.sql'),
      'utf8'
    );

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS priority');
    expect(sql).toContain('ROW_NUMBER() OVER');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_escalation_policies_org_priority');
  });
});
