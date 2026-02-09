import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('area parity migration', () => {
  it('adds area description and restricts deleting referenced areas', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/server/db/migrations/007_area_description_and_delete_restrict.sql'),
      'utf8'
    );

    expect(sql).toContain('ALTER TABLE areas');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS description TEXT');
    expect(sql).toContain('DROP CONSTRAINT IF EXISTS incidents_area_id_areas_id_fk');
    expect(sql).toContain('ON DELETE RESTRICT');
  });
});
