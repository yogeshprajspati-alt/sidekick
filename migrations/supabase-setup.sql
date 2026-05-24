-- ============================================
-- Sidekick - Supabase Database Setup
-- ============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. Create the entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);

-- 3. Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy: Any authenticated user can read all entries (shared diary)
CREATE POLICY "Authenticated users can read all entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can only insert their own entries
CREATE POLICY "Users can insert own entries"
  ON entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own entries
CREATE POLICY "Users can update own entries"
  ON entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own entries
CREATE POLICY "Users can delete own entries"
  ON entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Enable Realtime for the entries table
ALTER PUBLICATION supabase_realtime ADD TABLE entries;

-- ============================================
-- DONE! Your Sidekick database is ready 💕
-- ============================================
