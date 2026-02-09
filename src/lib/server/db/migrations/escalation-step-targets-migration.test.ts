import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('migration 011 escalation step targets', () => {
  it('creates incident_escalation_step_targets with indexes', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/server/db/migrations/011_escalation_step_targets.sql'),
      'utf8'
    );

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS incident_escalation_step_targets');
    expect(sql).toContain('PRIMARY KEY (incident_id, step_order, target_member_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_escalation_step_targets_org_incident_step');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_escalation_step_targets_member');
  });
});
