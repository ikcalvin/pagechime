-- Migration: Create user_preferences table
-- Per-user settings for newsletter, audio, and notification preferences.

CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  briefing_time time DEFAULT '07:00',
  briefing_timezone text DEFAULT 'America/New_York',
  summary_length text DEFAULT 'standard'
    CHECK (summary_length IN ('brief', 'standard', 'detailed')),
  playback_speed numeric(3,2) DEFAULT 1.0,
  voice text DEFAULT 'alloy',
  auto_play_next boolean DEFAULT true,
  notifications_briefing boolean DEFAULT true,
  notifications_new_issue boolean DEFAULT false,
  notifications_weekly boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
