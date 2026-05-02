-- College overrides
CREATE TABLE public.college_overrides (
  college_id TEXT PRIMARY KEY,
  tier TEXT,
  rankings JSONB NOT NULL DEFAULT '{}'::jsonb,
  known_programs TEXT[] NOT NULL DEFAULT '{}',
  cds_url TEXT,
  official_url TEXT,
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.college_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read college overrides" ON public.college_overrides FOR SELECT USING (true);
CREATE POLICY "admins write college overrides" ON public.college_overrides FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_college_overrides_updated BEFORE UPDATE ON public.college_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Site settings (single row keyed by id='global')
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY,
  logo_url TEXT,
  homepage_hero JSONB NOT NULL DEFAULT '{}'::jsonb,
  dropdown_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  mobile_spacing JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins write site settings" ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.site_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Admin nicknames
CREATE TABLE public.admin_nicknames (
  admin_user_id UUID PRIMARY KEY,
  nickname TEXT NOT NULL,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_nicknames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read nicknames" ON public.admin_nicknames FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write nicknames" ON public.admin_nicknames FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_admin_nicknames_updated BEFORE UPDATE ON public.admin_nicknames
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles: flag suspicious
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT false;