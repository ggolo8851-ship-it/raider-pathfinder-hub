CREATE TABLE public.text_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.text_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read text overrides" ON public.text_overrides FOR SELECT USING (true);
CREATE POLICY "admins write text overrides" ON public.text_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_text_overrides_updated_at BEFORE UPDATE ON public.text_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();