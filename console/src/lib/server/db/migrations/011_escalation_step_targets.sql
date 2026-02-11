CREATE TABLE IF NOT EXISTS incident_escalation_step_targets (
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES escalation_policies(id) ON DELETE SET NULL,
  step_order INT NOT NULL,
  target_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  notify_type TEXT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  PRIMARY KEY (incident_id, step_order, target_member_id)
);

CREATE INDEX IF NOT EXISTS idx_escalation_step_targets_org_incident_step
  ON incident_escalation_step_targets (organization_id, incident_id, step_order);

CREATE INDEX IF NOT EXISTS idx_escalation_step_targets_member
  ON incident_escalation_step_targets (target_member_id);
