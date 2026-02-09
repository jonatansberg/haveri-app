ALTER TABLE escalation_policies
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 1000;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at, id) AS rn
  FROM escalation_policies
)
UPDATE escalation_policies ep
SET priority = ranked.rn
FROM ranked
WHERE ep.id = ranked.id;

CREATE INDEX IF NOT EXISTS idx_escalation_policies_org_priority
  ON escalation_policies (organization_id, priority);
