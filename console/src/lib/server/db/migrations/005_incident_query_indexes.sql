CREATE INDEX IF NOT EXISTS idx_incidents_organization_id
  ON incidents (organization_id);

CREATE INDEX IF NOT EXISTS idx_incidents_facility_id
  ON incidents (facility_id);

CREATE INDEX IF NOT EXISTS idx_incident_current_state_organization_status
  ON incident_current_state (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id
  ON incident_events (incident_id);
