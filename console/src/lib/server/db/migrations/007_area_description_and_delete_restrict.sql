ALTER TABLE areas
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE incidents
  DROP CONSTRAINT IF EXISTS incidents_area_id_areas_id_fk;

ALTER TABLE incidents
  ADD CONSTRAINT incidents_area_id_areas_id_fk
  FOREIGN KEY (area_id)
  REFERENCES areas(id)
  ON DELETE RESTRICT;
