-- ============================================
-- Sidekick v4 - Migration Script
-- ============================================
-- Run this AFTER supabase-migration.sql (v2)
-- in your Supabase SQL Editor

-- 1. Add unlock_date column for Secret Letters
ALTER TABLE entries ADD COLUMN IF NOT EXISTS unlock_date TIMESTAMPTZ DEFAULT NULL;

-- 2. Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(entry_id, user_id, emoji)
);

-- 3. Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for reactions
CREATE POLICY "Authenticated users can read reactions"
  ON reactions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users insert own reactions"
  ON reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reactions"
  ON reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. RLS Policies for comments
CREATE POLICY "Authenticated users can read comments"
  ON comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users insert own comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments"
  ON comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 7. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reactions_entry_id ON reactions(entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_entries_unlock_date ON entries(unlock_date);

-- ============================================
-- DONE! v4 migration complete 💕
-- ============================================
