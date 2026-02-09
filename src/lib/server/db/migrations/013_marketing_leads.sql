CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  team_size TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_leads_type_created
  ON marketing_leads (lead_type, created_at DESC);
