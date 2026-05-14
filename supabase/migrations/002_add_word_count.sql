-- Migration: Add word_count column to articles
-- Sprint 2, Issue 10: Precompute word count during scraping
-- so the frontend can display reading time without receiving clean_text.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS word_count integer;

-- Backfill existing articles that have clean_text.
-- clean_text stores HTML (from Readability), so strip tags before counting.
-- COALESCE handles whitespace-only content gracefully (returns 0 instead of 1).
UPDATE articles
SET word_count = COALESCE(
  array_length(
    regexp_split_to_array(
      NULLIF(trim(regexp_replace(clean_text, '<[^>]+>', ' ', 'g')), ''),
      '\s+'
    ),
    1
  ),
  0
)
WHERE word_count IS NULL
  AND clean_text IS NOT NULL;

-- Index for potential future queries filtering/sorting by word count
CREATE INDEX IF NOT EXISTS idx_articles_word_count ON articles(word_count);
