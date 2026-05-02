
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  grad_year INT,
  setup_complete BOOLEAN NOT NULL DEFAULT false,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  admin_nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Whitelist
CREATE TABLE public.admin_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Blacklist
CREATE TABLE public.email_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_blacklist ENABLE ROW LEVEL SECURITY;

-- Subscriptions
CREATE TABLE public.email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  welcome_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Audit log
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  admin_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id TEXT NOT NULL,
  college_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, college_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Clubs (synced from Google Sheets)
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  classification TEXT,
  location TEXT,
  meeting_day TEXT,
  schedule TEXT,
  sponsor TEXT,
  sponsor_email TEXT,
  purpose TEXT,
  raw JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Has-role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_blacklisted(_email TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.email_blacklist WHERE lower(email) = lower(_email))
$$;

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clubs_updated BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New-user trigger: create profile + assign roles based on whitelist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin BOOLEAN;
  is_blocked BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.email_blacklist WHERE lower(email) = lower(NEW.email)) INTO is_blocked;
  IF is_blocked THEN
    RAISE EXCEPTION 'This email is blocked from accessing the app.';
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name, username)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    split_part(NEW.email,'@',1));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  SELECT EXISTS(SELECT 1 FROM public.admin_whitelist WHERE lower(email) = lower(NEW.email)) INTO is_admin;
  IF is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admins update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles (read own + admins read all; only admins write)
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins see all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- whitelist (admin only)
CREATE POLICY "admins read whitelist" ON public.admin_whitelist FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write whitelist" ON public.admin_whitelist FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- blacklist (admin only)
CREATE POLICY "admins read blacklist" ON public.email_blacklist FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write blacklist" ON public.email_blacklist FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- subscriptions: anyone can subscribe (insert), admins read
CREATE POLICY "anyone subscribe" ON public.email_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read subs" ON public.email_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage subs" ON public.email_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- audit log (admin read; system writes via security definer in edge fn or trigger)
CREATE POLICY "admins read audit" ON public.admin_audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write audit" ON public.admin_audit_log FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- bookmarks: per-user
CREATE POLICY "users view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- clubs: public read, admin write
CREATE POLICY "anyone read clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "admins write clubs" ON public.clubs FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed initial admin whitelist
INSERT INTO public.admin_whitelist (email) VALUES
  ('ggolo8851@gmail.com'),
  ('soccerstar9471@gmail.com')
ON CONFLICT (email) DO NOTHING;
