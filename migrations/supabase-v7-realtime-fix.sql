-- ============================================
-- Sidekick v7 — Realtime Fix for Truth or Dare
-- ============================================
-- Run this in your Supabase SQL Editor
-- This is REQUIRED for UPDATE and DELETE realtime events
-- to carry the full row data (payload.new / payload.old)

-- Without REPLICA IDENTITY FULL:
--   UPDATE → payload.new only has changed columns
--   DELETE → payload.old has NO data (so we can't get the id)

ALTER TABLE truth_dare_requests REPLICA IDENTITY FULL;

-- Also ensure entries table is full (for the diary feed DELETE events)
ALTER TABLE entries REPLICA IDENTITY FULL;

-- ============================================
-- DONE! Realtime UPDATE + DELETE now work 🎲
-- ============================================
