CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'members'
      AND column_name = 'team_id'
  ) THEN
    INSERT INTO team_members (team_id, member_id, organization_id)
    SELECT members.team_id, members.id, members.organization_id
    FROM members
    WHERE members.team_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

ALTER TABLE members
  DROP COLUMN IF EXISTS team_id;
