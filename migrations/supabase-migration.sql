-- ============================================
-- Sidekick v2 - Migration Script
-- ============================================
-- Run this AFTER the initial supabase-setup.sql
-- in your Supabase SQL Editor

-- 1. Add is_private column
ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL;

-- 2. Create index for private filtering
CREATE INDEX IF NOT EXISTS idx_entries_is_private ON entries(is_private);

-- 3. Drop old RLS policies (safe if they don't exist)
DROP POLICY IF EXISTS "Authenticated users can read all entries" ON entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON entries;
DROP POLICY IF EXISTS "Users can update own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON entries;

-- 4. New RLS Policies with Admin + Private support

-- Admin (dp7800549@gmail.com) can read EVERYTHING
CREATE POLICY "Admin reads all entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'dp7800549@gmail.com'
  );

-- Regular users can read shared (non-private) entries
CREATE POLICY "Users read shared entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (
    is_private = false
    AND auth.jwt() ->> 'email' != 'dp7800549@gmail.com'
  );

-- Users can read their own private entries
CREATE POLICY "Users read own private entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (
    is_private = true
    AND auth.uid() = user_id
    AND auth.jwt() ->> 'email' != 'dp7800549@gmail.com'
  );

-- Users can insert their own entries (shared or private)
CREATE POLICY "Users insert own entries"
  ON entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users update own entries"
  ON entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users delete own entries"
  ON entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- DONE! v2 migration complete 💕
-- ============================================
