-- Enable Row Level Security on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- articles policies
-- ============================================================
CREATE POLICY "Users can select own articles"
  ON articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles"
  ON articles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON articles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- collections policies
-- ============================================================
CREATE POLICY "Users can select own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON collections FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- tags policies
-- ============================================================
CREATE POLICY "Users can select own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON tags FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- article_tags policies
-- (no direct user_id; ownership checked via articles join)
-- ============================================================
CREATE POLICY "Users can select own article_tags"
  ON article_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
        AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own article_tags"
  ON article_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
        AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own article_tags"
  ON article_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
        AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own article_tags"
  ON article_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
        AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access"
  ON article_tags FOR ALL
  USING (auth.role() = 'service_role');
