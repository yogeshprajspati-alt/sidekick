-- ============================================
-- Sidekick v5 - Auto-Archive Migration
-- ============================================
-- Run this in your Supabase SQL Editor
-- AFTER supabase-v4-migration.sql

-- 1. Add archive columns to entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Index for fast archive queries
CREATE INDEX IF NOT EXISTS idx_entries_is_archived ON entries(is_archived);
CREATE INDEX IF NOT EXISTS idx_entries_archived_at ON entries(archived_at);

-- 3. Update existing RLS to allow updating archive status
--    (Users can archive/restore their own entries; admin can do all)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entries'
      AND policyname = 'Users can update own entry archive status'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own entry archive status"
        ON entries FOR UPDATE TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    $policy$;
  END IF;
END
$$;

-- ============================================
-- DONE! v5 migration complete 🧹
-- ============================================
