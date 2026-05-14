-- Migration: Create newsletter_sources table
-- Tracks newsletter senders a user receives from.

CREATE TABLE newsletter_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  sender_email text NOT NULL,
  sender_name text,
  logo_url text,
  is_active boolean DEFAULT true,
  issues_count integer DEFAULT 0,
  last_received_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sender_email)
);

CREATE INDEX idx_newsletter_sources_user ON newsletter_sources(user_id);
