CREATE TABLE public.custom_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  icon TEXT,
  order_index INT NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read published custom tabs"
  ON public.custom_tabs FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins write custom tabs"
  ON public.custom_tabs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_custom_tabs_updated_at
  BEFORE UPDATE ON public.custom_tabs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();