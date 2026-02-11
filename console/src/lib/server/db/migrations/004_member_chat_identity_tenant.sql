ALTER TABLE member_chat_identities
  ADD COLUMN IF NOT EXISTS platform_tenant_id TEXT NOT NULL DEFAULT '';

ALTER TABLE member_chat_identities
  DROP CONSTRAINT IF EXISTS member_chat_identities_organization_id_platform_platform_user_id_key;

ALTER TABLE member_chat_identities
  ADD CONSTRAINT member_chat_identities_org_platform_tenant_platform_user_key
  UNIQUE (organization_id, platform, platform_tenant_id, platform_user_id);
