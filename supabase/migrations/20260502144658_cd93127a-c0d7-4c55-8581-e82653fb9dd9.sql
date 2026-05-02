CREATE TABLE public.international_colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  city text,
  website text,
  programs text[] NOT NULL DEFAULT '{}',
  admit_rate numeric,
  avg_cost_usd integer,
  setting text,
  athletic_division text,
  enrollment integer,
  notes text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.international_colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read intl colleges" ON public.international_colleges FOR SELECT USING (true);
CREATE POLICY "admins write intl colleges" ON public.international_colleges FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_intl_colleges_updated
  BEFORE UPDATE ON public.international_colleges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.system_state (
  id text PRIMARY KEY,
  last_refresh_at timestamptz,
  next_refresh_at timestamptz,
  last_refresh_summary jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read system state" ON public.system_state FOR SELECT USING (true);
CREATE POLICY "admins write system state" ON public.system_state FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_system_state_updated
  BEFORE UPDATE ON public.system_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_state (id, last_refresh_at, next_refresh_at)
VALUES ('global', now(), date_trunc('month', now()) + interval '1 month');