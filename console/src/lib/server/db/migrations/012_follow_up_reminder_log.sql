CREATE TABLE IF NOT EXISTS follow_up_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  follow_up_id UUID NOT NULL REFERENCES follow_ups(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follow_up_id, reminder_type, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminder_log_org_date
  ON follow_up_reminder_log (organization_id, reminder_date);
