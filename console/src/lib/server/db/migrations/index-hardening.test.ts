import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readMigrationFile(name: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'src/lib/server/db/migrations', name), 'utf8');
}

describe('index hardening migration', () => {
  it('adds indexes used by incident list and filter workloads', () => {
    const sql = readMigrationFile('005_incident_query_indexes.sql');

    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_incidents_organization_id');
    expect(sql).toContain('ON incidents (organization_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_incidents_facility_id');
    expect(sql).toContain('ON incidents (facility_id)');
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_incident_current_state_organization_status'
    );
    expect(sql).toContain('ON incident_current_state (organization_id, status)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id');
    expect(sql).toContain('ON incident_events (incident_id)');
  });
});
