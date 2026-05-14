-- Migration: Performance indexes for existing and new tables
-- Covers TTS deduplication, filtered list queries, status views, and join tables.

-- Articles: TTS deduplication lookups by original_url
CREATE INDEX IF NOT EXISTS idx_articles_original_url ON articles(original_url);

-- Articles: filtered list queries (inbox/archive per collection)
CREATE INDEX IF NOT EXISTS idx_articles_user_filters ON articles(user_id, is_deleted, is_archived, collection_id);

-- Articles: status-filtered views
CREATE INDEX IF NOT EXISTS idx_articles_user_status ON articles(user_id, status);

-- article_tags: ensure both FK columns are indexed for join performance
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);
