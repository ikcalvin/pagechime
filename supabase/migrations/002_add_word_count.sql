-- Migration: Add word_count column to articles
-- Sprint 2, Issue 10: Precompute word count during scraping
-- so the frontend can display reading time without receiving clean_text.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS word_count integer;

-- Backfill existing articles that have clean_text
UPDATE articles
SET word_count = array_length(regexp_split_to_array(trim(clean_text), '\s+'), 1)
WHERE word_count IS NULL
  AND clean_text IS NOT NULL;

-- Index for potential future queries filtering/sorting by word count
CREATE INDEX IF NOT EXISTS idx_articles_word_count ON articles(word_count);
