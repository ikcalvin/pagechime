-- Migration: Add forwarding_hash column to user_preferences
-- Used by the newsletter forwarding address system to route incoming emails to users.

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS forwarding_hash text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_user_preferences_forwarding_hash ON user_preferences(forwarding_hash);
