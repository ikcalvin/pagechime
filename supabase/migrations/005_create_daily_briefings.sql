-- Migration: Create daily_briefings table
-- Combined audio briefings assembled from multiple newsletter summaries.

CREATE TABLE daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  briefing_date date NOT NULL,
  audio_url text,
  issue_ids uuid[] NOT NULL,
  duration_seconds integer,
  newsletter_count integer,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, briefing_date)
);

CREATE INDEX idx_briefings_user_date ON daily_briefings(user_id, briefing_date DESC);
