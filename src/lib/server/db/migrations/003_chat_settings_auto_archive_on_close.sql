ALTER TABLE organization_chat_settings
  ADD COLUMN IF NOT EXISTS auto_archive_on_close BOOLEAN NOT NULL DEFAULT FALSE;
