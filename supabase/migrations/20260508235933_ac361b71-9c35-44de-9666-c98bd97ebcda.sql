ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS extra_sports jsonb NOT NULL DEFAULT '[]'::jsonb;