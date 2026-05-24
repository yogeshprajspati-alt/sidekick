-- ============================================
-- Sidekick v6 — Truth or Dare Migration
-- ============================================
-- Run this in your Supabase SQL Editor
-- AFTER supabase-v5-migration.sql

-- 1. Create the truth_dare_requests table
CREATE TABLE IF NOT EXISTS truth_dare_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('truth', 'dare')),
    intensity TEXT DEFAULT 'soft' CHECK (intensity IN ('soft', 'medium', 'deep')),
    text TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'answered')),
    response_text TEXT,
    is_incognito BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT now(),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE truth_dare_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Both users can read all requests
CREATE POLICY "Authenticated users can read requests"
  ON truth_dare_requests FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
  ON truth_dare_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can update/delete their own requests (unsend, cancel)
CREATE POLICY "Users can update own requests"
  ON truth_dare_requests FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can delete own requests"
  ON truth_dare_requests FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE truth_dare_requests;

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_tdr_sender ON truth_dare_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_tdr_status ON truth_dare_requests(status);
CREATE INDEX IF NOT EXISTS idx_tdr_created ON truth_dare_requests(created_at DESC);

-- ============================================
-- DONE! v6 migration complete 🎲
-- ============================================
