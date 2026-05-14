-- Migration: RLS policies for newsletter tables
-- Per-user isolation + service role bypass for Inngest background jobs.

-- ============================================================
-- newsletter_sources
-- ============================================================
ALTER TABLE newsletter_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sources"
  ON newsletter_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sources"
  ON newsletter_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sources"
  ON newsletter_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sources"
  ON newsletter_sources FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on newsletter_sources"
  ON newsletter_sources FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- newsletter_issues
-- ============================================================
ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own issues"
  ON newsletter_issues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own issues"
  ON newsletter_issues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own issues"
  ON newsletter_issues FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own issues"
  ON newsletter_issues FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on newsletter_issues"
  ON newsletter_issues FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- daily_briefings
-- ============================================================
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefings"
  ON daily_briefings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefings"
  ON daily_briefings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefings"
  ON daily_briefings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own briefings"
  ON daily_briefings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on daily_briefings"
  ON daily_briefings FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- user_preferences
-- ============================================================
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on user_preferences"
  ON user_preferences FOR ALL
  USING (auth.role() = 'service_role');
