
CREATE TABLE public.faculty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  bio_short TEXT,
  bio_full TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  contact_link TEXT,
  contributions TEXT,
  projects TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "admins write faculty" ON public.faculty FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_faculty_updated_at
  BEFORE UPDATE ON public.faculty
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contribution TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read contributors" ON public.contributors FOR SELECT USING (true);
CREATE POLICY "admins write contributors" ON public.contributors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_contributors_updated_at
  BEFORE UPDATE ON public.contributors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
