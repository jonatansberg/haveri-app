ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE organizations
SET slug = CONCAT(
  COALESCE(
    NULLIF(
      TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'org'
  ),
  '-',
  SUBSTRING(REPLACE(id::TEXT, '-', ''), 1, 8)
)
WHERE slug IS NULL OR slug = '';

ALTER TABLE organizations
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
  ON organizations (slug);

CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_memberships_user
  ON organization_memberships(user_id);
