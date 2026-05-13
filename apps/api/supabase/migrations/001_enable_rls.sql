-- Enable Row Level Security on all user-facing tables
-- and create policies so each user can only access their own data.

-- ============================================================
-- articles
-- ============================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own articles"
  ON articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
  ON articles FOR DELETE
  USING (auth.uid() = user_id);

-- Allow the service role (Inngest background jobs) to update any article.
-- The service role bypasses RLS by default, but this explicit policy
-- makes intent clear if "force row level security" is enabled on the table.
CREATE POLICY "Service role can manage all articles"
  ON articles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- collections
-- ============================================================
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- tags
-- ============================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- article_tags (junction table)
-- ============================================================
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- Users can manage article_tags only if they own the related article.
CREATE POLICY "Users can select article_tags for their articles"
  ON article_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
        AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert article_tags for their articles"
  ON article_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
        AND articles.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = article_tags.tag_id
        AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete article_tags for their articles"
  ON article_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_tags.article_id
        AND articles.user_id = auth.uid()
    )
  );

-- Service role policy for background jobs
CREATE POLICY "Service role can manage all article_tags"
  ON article_tags FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
