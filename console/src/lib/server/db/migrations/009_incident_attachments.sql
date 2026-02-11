CREATE TABLE IF NOT EXISTS incident_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL,
  source_event_id TEXT,
  source_content_url TEXT,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  byte_size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_incident_attachments_org_incident
  ON incident_attachments (organization_id, incident_id);
