import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('team membership parity migration', () => {
  it('creates team_members, backfills from legacy team_id, and drops team_id', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/server/db/migrations/008_team_members_many_to_many.sql'),
      'utf8'
    );

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS team_members');
    expect(sql).toContain('INSERT INTO team_members');
    expect(sql).toContain('members.team_id');
    expect(sql).toContain('ALTER TABLE members');
    expect(sql).toContain('DROP COLUMN IF EXISTS team_id');
  });
});
