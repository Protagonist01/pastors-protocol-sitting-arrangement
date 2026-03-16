-- Pastors' Protocol: Supabase Database Schema

-- 1. Create a custom ENUM for roles
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'protocol');

-- 2. Create the Profiles table (tied 1-to-1 with auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role user_role DEFAULT 'protocol'::user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Protocol members can view all profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- Only Admins can update roles (or profiles themselves can update their own name)
CREATE POLICY "Users can edit their own profile OR admins can edit all" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Trigger to automatically create a profile record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unnamed User'), 
    'protocol' -- Default role is protocol (view only)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 4. Create Conferences Table
CREATE TABLE public.conferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE,
  venue TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;


-- 5. Create Sessions Table
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conference_id UUID REFERENCES public.conferences(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE,
  time TIME,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;


-- 6. Create Seating Configs Table
-- Stores the rows/cols for each section in a session
CREATE TABLE public.seating_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  section_id TEXT NOT NULL, -- e.g. 'choir', 'left', 'middle'
  rows INTEGER NOT NULL DEFAULT 0,
  cols INTEGER NOT NULL DEFAULT 0,
  UNIQUE(session_id, section_id)
);
ALTER TABLE public.seating_configs ENABLE ROW LEVEL SECURITY;


-- 7. Create Attendees Table
CREATE TYPE attendance_status AS ENUM ('pending', 'arrived', 'seated', 'absent');

CREATE TABLE public.attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  title TEXT, -- User-inputted string (e.g. Bishop, Hon, Dr.)
  church TEXT,
  extension TEXT,
  section_id TEXT, -- Should match a valid UI section
  row_num INTEGER,
  col_num INTEGER,
  status attendance_status DEFAULT 'pending'::attendance_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Ensure row/col uniqueness within a section per session
  UNIQUE(session_id, section_id, row_num, col_num)
);
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;


-- 8. RLS Policies for Core Data Tables (Conferences, Sessions, Configs, Attendees)

-- Helper function to check if user has edit privileges (Admin or Editor)
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Applies to conferences, sessions, seating_configs, attendees:
-- READ: Everyone (authenticated) can read all data
CREATE POLICY "Anyone can view conferences" ON public.conferences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can view sessions" ON public.sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can view configs" ON public.seating_configs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can view attendees" ON public.attendees FOR SELECT USING (auth.role() = 'authenticated');

-- MUTATE: Only Admins and Editors can Insert/Update/Delete core data
CREATE POLICY "Editors/Admins can insert conferences" ON public.conferences FOR INSERT WITH CHECK (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can update conferences" ON public.conferences FOR UPDATE USING (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can delete conferences" ON public.conferences FOR DELETE USING (public.is_editor_or_admin());

CREATE POLICY "Editors/Admins can insert sessions" ON public.sessions FOR INSERT WITH CHECK (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can update sessions" ON public.sessions FOR UPDATE USING (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can delete sessions" ON public.sessions FOR DELETE USING (public.is_editor_or_admin());

CREATE POLICY "Editors/Admins can insert configs" ON public.seating_configs FOR INSERT WITH CHECK (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can update configs" ON public.seating_configs FOR UPDATE USING (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can delete configs" ON public.seating_configs FOR DELETE USING (public.is_editor_or_admin());

CREATE POLICY "Editors/Admins can insert attendees" ON public.attendees FOR INSERT WITH CHECK (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can update attendees" ON public.attendees FOR UPDATE USING (public.is_editor_or_admin());
CREATE POLICY "Editors/Admins can delete attendees" ON public.attendees FOR DELETE USING (public.is_editor_or_admin());

-- Real-time broadcasts
alter publication supabase_realtime add table public.attendees;
