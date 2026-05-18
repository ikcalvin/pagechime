-- Summary-only TTS: add summary columns to articles, drop full_audio_url from newsletter_issues
-- Part of the Deepgram TTS migration (PR #39)

-- Articles now get GPT-summarized before TTS, matching the newsletter pipeline
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS summary_text text,
  ADD COLUMN IF NOT EXISTS summary_word_count integer;

-- Newsletter full-text audio is no longer generated — drop the column
ALTER TABLE newsletter_issues
  DROP COLUMN IF EXISTS full_audio_url;
