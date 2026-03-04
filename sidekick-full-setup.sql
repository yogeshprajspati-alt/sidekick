-- ============================================================
-- SIDEKICK — Complete Supabase Database Setup (Fresh Project)
-- ============================================================
-- Run this ONCE in your new Supabase project's SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
--
-- This file creates ALL tables, indexes, RLS policies, triggers,
-- realtime, and admin access needed for the full Sidekick app.
--
-- Admin email: dp7800549@gmail.com  (change if needed)
-- ============================================================


-- ╔══════════════════════════════════════════════╗
-- ║  1. ENTRIES TABLE (Core Diary)               ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.entries (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text        TEXT        NOT NULL,
  mood        TEXT        NOT NULL DEFAULT '❤️',
  is_private  BOOLEAN     NOT NULL DEFAULT FALSE,
  tags        TEXT[]      DEFAULT '{}',
  category    TEXT        DEFAULT 'Personal',
  unlock_date TIMESTAMPTZ DEFAULT NULL,
  is_archived BOOLEAN     DEFAULT FALSE,
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entries_created_at  ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_id     ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_is_private  ON entries(is_private);
CREATE INDEX IF NOT EXISTS idx_entries_tags        ON entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_entries_category    ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_unlock_date ON entries(unlock_date);
CREATE INDEX IF NOT EXISTS idx_entries_is_archived ON entries(is_archived);
CREATE INDEX IF NOT EXISTS idx_entries_archived_at ON entries(archived_at);

-- Enable RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admin can read ALL entries (private + shared + archived)
CREATE POLICY "admin_read_all_entries"
  ON entries FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'dp7800549@gmail.com');

-- Admin can delete ANY entry
CREATE POLICY "admin_delete_any_entry"
  ON entries FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = 'dp7800549@gmail.com');

-- Regular users read shared (non-private) entries
CREATE POLICY "users_read_shared_entries"
  ON entries FOR SELECT TO authenticated
  USING (
    is_private = false
    AND auth.jwt() ->> 'email' != 'dp7800549@gmail.com'
  );

-- Users read their own private entries
CREATE POLICY "users_read_own_private_entries"
  ON entries FOR SELECT TO authenticated
  USING (
    is_private = true
    AND auth.uid() = user_id
    AND auth.jwt() ->> 'email' != 'dp7800549@gmail.com'
  );

-- Users insert their own entries
CREATE POLICY "users_insert_own_entries"
  ON entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users update their own entries (content, archive status, etc.)
CREATE POLICY "users_update_own_entries"
  ON entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users delete their own entries
CREATE POLICY "users_delete_own_entries"
  ON entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime + full row data on UPDATE/DELETE
ALTER PUBLICATION supabase_realtime ADD TABLE entries;
ALTER TABLE entries REPLICA IDENTITY FULL;


-- ╔══════════════════════════════════════════════╗
-- ║  2. PROFILES TABLE (User Names & Emails)     ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name  TEXT,
  email      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (needed for author names in feed)
CREATE POLICY "profiles_viewable_by_everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users insert their own profile
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ╔══════════════════════════════════════════════╗
-- ║  3. REACTIONS TABLE (Emoji Reactions)         ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.reactions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id   UUID        REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID        REFERENCES auth.users(id) NOT NULL,
  emoji      TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_id, user_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_entry_id ON reactions(entry_id);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read reactions
CREATE POLICY "users_read_reactions"
  ON reactions FOR SELECT TO authenticated
  USING (true);

-- Users insert their own reactions
CREATE POLICY "users_insert_own_reactions"
  ON reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users delete their own reactions
CREATE POLICY "users_delete_own_reactions"
  ON reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;


-- ╔══════════════════════════════════════════════╗
-- ║  4. COMMENTS TABLE                            ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id   UUID        REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID        REFERENCES auth.users(id) NOT NULL,
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments(entry_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read comments
CREATE POLICY "users_read_comments"
  ON comments FOR SELECT TO authenticated
  USING (true);

-- Users insert their own comments
CREATE POLICY "users_insert_own_comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users delete their own comments
CREATE POLICY "users_delete_own_comments"
  ON comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE comments;


-- ╔══════════════════════════════════════════════╗
-- ║  5. USER PREFERENCES TABLE (Theme/Font/etc)   ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme       TEXT        DEFAULT 'midnight-rose',
  font_family TEXT        DEFAULT 'Caveat',
  font_size   INTEGER     DEFAULT 22,
  layout      TEXT        DEFAULT 'card',
  auto_save   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users read their own preferences
CREATE POLICY "users_read_own_preferences"
  ON user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users insert their own preferences
CREATE POLICY "users_insert_own_preferences"
  ON user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users update their own preferences
CREATE POLICY "users_update_own_preferences"
  ON user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ╔══════════════════════════════════════════════╗
-- ║  6. TRUTH OR DARE REQUESTS TABLE              ║
-- ╚══════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.truth_dare_requests (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id     UUID        REFERENCES auth.users(id) NOT NULL,
  type          TEXT        NOT NULL CHECK (type IN ('truth', 'dare')),
  intensity     TEXT        DEFAULT 'soft' CHECK (intensity IN ('soft', 'medium', 'deep')),
  text          TEXT        NOT NULL,
  status        TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'answered')),
  response_text TEXT,
  is_incognito  BOOLEAN     DEFAULT FALSE,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  responded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tdr_sender  ON truth_dare_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_tdr_status  ON truth_dare_requests(status);
CREATE INDEX IF NOT EXISTS idx_tdr_created ON truth_dare_requests(created_at DESC);

-- Enable RLS
ALTER TABLE truth_dare_requests ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read requests
CREATE POLICY "users_read_td_requests"
  ON truth_dare_requests FOR SELECT TO authenticated
  USING (true);

-- Users insert their own requests
CREATE POLICY "users_insert_own_td_requests"
  ON truth_dare_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Any authenticated user can update requests (to answer/decline)
CREATE POLICY "users_update_td_requests"
  ON truth_dare_requests FOR UPDATE TO authenticated
  USING (true);

-- Only sender can delete (unsend)
CREATE POLICY "users_delete_own_td_requests"
  ON truth_dare_requests FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Realtime + full row data
ALTER PUBLICATION supabase_realtime ADD TABLE truth_dare_requests;
ALTER TABLE truth_dare_requests REPLICA IDENTITY FULL;


-- ╔══════════════════════════════════════════════╗
-- ║  7. ENABLE REALTIME GLOBALLY                  ║
-- ╚══════════════════════════════════════════════╝
-- The individual ALTER PUBLICATION statements above 
-- already add each table. This section is a reminder
-- to enable Realtime in the Supabase Dashboard:
--   Database → Replication → supabase_realtime → 
--   ensure entries, reactions, comments, truth_dare_requests are checked.


-- ╔══════════════════════════════════════════════╗
-- ║  DONE! Your Sidekick database is ready 💕     ║
-- ╚══════════════════════════════════════════════╝
--
-- NEXT STEPS:
-- 1. Go to Authentication → Settings and enable Email auth
-- 2. IMPORTANT: Turn OFF "Confirm email" under Email settings
--    (so users can sign up without email verification)
-- 3. Update your .env file with the new project's:
--      VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
--      VITE_SUPABASE_ANON_KEY=your_anon_key_here
-- 4. (Optional) Go to Authentication → URL Configuration
--    and add your deployed domain to Redirect URLs
-- ============================================================
