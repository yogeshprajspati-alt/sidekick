-- ============================================
-- Sidekick - Supabase Features Migration
-- ============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. Update existing entries table with new columns
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Personal';

-- Create performance indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_entries_tags ON entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);

-- 2. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme TEXT DEFAULT 'midnight-rose',
  font_family TEXT DEFAULT 'Caveat',
  font_size INTEGER DEFAULT 22,
  layout TEXT DEFAULT 'card',
  auto_save BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Admin Policies for existing entries table
-- Replace 'dp7800549@gmail.com' with the actual admin email if different.

-- Policy: Admin can read all entries regardless of privacy
CREATE POLICY "Admin can read all entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'dp7800549@gmail.com'
  );

-- Policy: Admin can delete any entry
CREATE POLICY "Admin can delete any entry"
  ON entries
  FOR DELETE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'dp7800549@gmail.com'
  );

-- Note: In Supabase, you might need to use a different approach to access auth.users from standard policies a view or a separate role/claim, 
-- but checking the email directly via a function or similar is a common approach if you have permissions. 
-- Wait, auth.email() function exists in Supabase.
-- Let's update the Admin policies to use auth.email() directly.

DROP POLICY IF EXISTS "Admin can read all entries" ON entries;
CREATE POLICY "Admin can read all entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'dp7800549@gmail.com');

DROP POLICY IF EXISTS "Admin can delete any entry" ON entries;
CREATE POLICY "Admin can delete any entry"
  ON entries
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'dp7800549@gmail.com');
