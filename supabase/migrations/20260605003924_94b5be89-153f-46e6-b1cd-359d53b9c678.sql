
-- 1. Tighten has_role: never grant true on NULL user_id
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. Lock down email-queue helper functions (service-role only) + fix search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 3. Protect staff emails in clubs. Anon gets a sanitized view; base table is auth-only.
DROP POLICY IF EXISTS "anyone read clubs" ON public.clubs;

CREATE POLICY "authenticated read clubs"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.clubs FROM anon;

CREATE OR REPLACE VIEW public.clubs_public
WITH (security_invoker = true) AS
SELECT
  id, name, classification, location, meeting_day, schedule,
  -- sponsor name kept, but email and raw blob hidden from anon
  sponsor, purpose, updated_at
FROM public.clubs;

GRANT SELECT ON public.clubs_public TO anon, authenticated;
