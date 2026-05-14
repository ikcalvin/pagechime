-- Migration: Create newsletter_issues table
-- Stores individual newsletter emails received and processed.

CREATE TABLE newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  source_id uuid REFERENCES newsletter_sources,
  subject text,
  original_html text,
  clean_text text,
  summary_text text,
  word_count integer,
  summary_word_count integer,
  audio_url text,
  full_audio_url text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'parsing', 'summarizing', 'generating_audio', 'ready', 'failed')),
  received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_newsletter_issues_user ON newsletter_issues(user_id);
CREATE INDEX idx_newsletter_issues_source ON newsletter_issues(source_id);
CREATE INDEX idx_newsletter_issues_status ON newsletter_issues(user_id, status, received_at DESC);
