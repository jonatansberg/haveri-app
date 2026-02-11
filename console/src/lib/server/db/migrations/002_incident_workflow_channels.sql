ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS comms_lead_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS global_channel_ref TEXT,
  ADD COLUMN IF NOT EXISTS global_message_ref TEXT;

CREATE TABLE IF NOT EXISTS organization_chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  global_incident_channel_ref TEXT NOT NULL,
  auto_create_incident_channel BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, platform)
);
