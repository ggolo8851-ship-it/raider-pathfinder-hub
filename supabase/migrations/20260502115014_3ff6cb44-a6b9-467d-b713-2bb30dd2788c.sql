-- 1) Backfill: any existing user whose email is on the whitelist gets admin role
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
JOIN public.admin_whitelist w ON lower(w.email) = lower(p.email)
ON CONFLICT DO NOTHING;

-- 2) Trigger on profiles: whenever a profile is created/updated, if email is whitelisted, grant admin.
-- This covers Google sign-in for accounts that existed before being whitelisted, or whose
-- handle_new_user run somehow missed the whitelist check.
CREATE OR REPLACE FUNCTION public.sync_admin_from_whitelist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_whitelist WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_admin_from_whitelist_trg ON public.profiles;
CREATE TRIGGER sync_admin_from_whitelist_trg
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_admin_from_whitelist();

-- 3) Trigger on admin_whitelist: when an email is added to the whitelist, immediately grant admin
-- to any existing user with that email.
CREATE OR REPLACE FUNCTION public.grant_admin_on_whitelist_add()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.user_id, 'admin'::app_role
  FROM public.profiles p
  WHERE lower(p.email) = lower(NEW.email)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_admin_on_whitelist_add_trg ON public.admin_whitelist;
CREATE TRIGGER grant_admin_on_whitelist_add_trg
AFTER INSERT ON public.admin_whitelist
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_whitelist_add();