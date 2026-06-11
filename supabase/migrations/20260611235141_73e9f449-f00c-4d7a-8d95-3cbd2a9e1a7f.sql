
-- 1. Remove newsletter_subscribers (feature was removed earlier)
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;

-- 2. Defense-in-depth INSERT policy on profiles
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Restore EXECUTE on is_blacklisted so client can call it instead of querying the table
GRANT EXECUTE ON FUNCTION public.is_blacklisted(text) TO authenticated;

-- 4. Restrict clubs PII exposure. Drop the broad authenticated SELECT policy
-- and have non-admin client code read from clubs_public view (which excludes the
-- `raw` JSON blob). Admins still get full access via existing admin policy.
DROP POLICY IF EXISTS "authenticated read clubs" ON public.clubs;

-- Recreate clubs_public so authenticated users still see sponsor_email
-- (needed to contact club sponsors from the ClubsPage), but the raw column
-- stays hidden and anon never sees the email.
DROP VIEW IF EXISTS public.clubs_public;
CREATE VIEW public.clubs_public
WITH (security_invoker = true) AS
SELECT
  id, name, classification, location, meeting_day, schedule,
  sponsor,
  CASE WHEN auth.role() = 'authenticated' THEN sponsor_email ELSE NULL END AS sponsor_email,
  purpose, updated_at
FROM public.clubs;

GRANT SELECT ON public.clubs_public TO anon, authenticated;
