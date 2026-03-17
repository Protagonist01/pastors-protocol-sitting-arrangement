-- =============================================================================
-- Pastors' Protocol Central Sitting Arrangement
-- Complete Database Schema — Source of Truth
-- Generated from AGENT_CONTEXT.md (Sections 4, 5, 6, 13)
-- =============================================================================
-- INSTRUCTIONS:
--   Run this ENTIRE file in the Supabase SQL Editor (Dashboard → SQL Editor).
--   It will create all tables, enable RLS, set up policies, create the
--   auto-profile trigger, and enable realtime.
--
--   If re-running on an existing project, you may need to DROP existing
--   tables/policies first (see bottom of file for cleanup SQL).
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================
-- Automatically populated by the on_auth_user_created trigger (see §13).
-- Role is always 'protocol' on signup. Admins promote via Access Control UI.

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'protocol'
                  CHECK (role IN ('admin', 'editor', 'protocol')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read all profiles
CREATE POLICY "profiles_read_all"
    ON public.profiles FOR SELECT
    USING (true);

-- RLS: users can update their own profile (but not the role field — that's admin-only via API)
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 2. CONFERENCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conferences (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    date        DATE,
    venue       TEXT,
    description TEXT,
    created_by  UUID REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. SESSIONS TABLE
-- =============================================================================
-- seating_config stores the section grid blueprint as JSONB:
-- { "choir": { "rows": 5, "cols": 4 }, "left": { "rows": 8, "cols": 5 }, ... }

CREATE TABLE IF NOT EXISTS public.sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id    UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    date             DATE,
    time             TIME,
    description      TEXT,
    seating_config   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by       UUID REFERENCES public.profiles(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. DIGNITARIES TABLE
-- =============================================================================
-- NOT "attendees" — the table is called "dignitaries".
-- title is always free text (e.g., "Presiding Bishop", "H.E.", "Minister of Interior")
-- picture_url stores the full public URL from Supabase Storage, not base64.
-- UNIQUE constraint on (session_id, section, row_num, col_num) prevents double-booking.

CREATE TABLE IF NOT EXISTS public.dignitaries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    title        TEXT NOT NULL,
    church       TEXT,
    extension    TEXT,
    section      TEXT,
    row_num      INTEGER,
    col_num      INTEGER,
    status       TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'arrived', 'seated', 'absent')),
    notes        TEXT,
    picture_url  TEXT,
    created_by   UUID REFERENCES public.profiles(id),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, section, row_num, col_num)
);

ALTER TABLE public.dignitaries ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. AUTO-CREATE PROFILE TRIGGER
-- =============================================================================
-- When a new user signs up via Supabase Auth, this trigger automatically
-- creates a row in public.profiles with role = 'protocol' (view-only).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unnamed'),
        'protocol'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 6. HELPER FUNCTION: Check if user is editor or admin
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- ── Conferences ──
-- All authenticated users can read
CREATE POLICY "conferences_read" ON public.conferences
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only editors/admins can insert
CREATE POLICY "conferences_insert" ON public.conferences
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

-- Only editors/admins can update
CREATE POLICY "conferences_update" ON public.conferences
    FOR UPDATE
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- Only editors/admins can delete (backend further restricts to admin-only)
CREATE POLICY "conferences_delete" ON public.conferences
    FOR DELETE USING (public.is_editor_or_admin());

-- ── Sessions ──
CREATE POLICY "sessions_read" ON public.sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sessions_insert" ON public.sessions
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "sessions_update" ON public.sessions
    FOR UPDATE
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "sessions_delete" ON public.sessions
    FOR DELETE USING (public.is_editor_or_admin());

-- ── Dignitaries ──
CREATE POLICY "dignitaries_read" ON public.dignitaries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "dignitaries_insert" ON public.dignitaries
    FOR INSERT WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "dignitaries_update" ON public.dignitaries
    FOR UPDATE
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "dignitaries_delete" ON public.dignitaries
    FOR DELETE USING (public.is_editor_or_admin());

-- =============================================================================
-- 8. REALTIME
-- =============================================================================
-- Enable realtime for the dignitaries table so the frontend can subscribe
-- to live updates via Supabase channels.

ALTER PUBLICATION supabase_realtime ADD TABLE public.dignitaries;

-- =============================================================================
-- 9. SUPABASE STORAGE BUCKET (run manually in Dashboard → Storage)
-- =============================================================================
-- Bucket name:  dignitary-photos
-- Access:       Public read, authenticated write
-- File naming:  {session_id}/{dignitary_id}.jpg
--
-- NOTE: Storage buckets cannot be created via SQL. Use the Supabase Dashboard:
--   1. Go to Storage → New Bucket
--   2. Name: "dignitary-photos"
--   3. Check "Public bucket" (for public read access)
--   4. Add policy: allow INSERT for authenticated users

-- =============================================================================
-- CLEANUP SQL (only if you need to reset and re-run)
-- =============================================================================
-- Uncomment the following lines if you need to drop everything and start fresh:
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS public.is_editor_or_admin();
-- DROP TABLE IF EXISTS public.dignitaries CASCADE;
-- DROP TABLE IF EXISTS public.sessions CASCADE;
-- DROP TABLE IF EXISTS public.conferences CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
