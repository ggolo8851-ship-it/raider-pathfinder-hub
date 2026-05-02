
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blacklisted(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "anyone subscribe" ON public.email_subscriptions;
CREATE POLICY "non-blacklisted subscribe" ON public.email_subscriptions
  FOR INSERT WITH CHECK (NOT EXISTS (SELECT 1 FROM public.email_blacklist b WHERE lower(b.email) = lower(email_subscriptions.email)));
