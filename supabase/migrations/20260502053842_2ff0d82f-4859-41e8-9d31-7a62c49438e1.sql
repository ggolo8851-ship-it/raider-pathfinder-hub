-- Drop tables we no longer need
DROP TABLE IF EXISTS public.password_reset_requests CASCADE;
DROP TABLE IF EXISTS public.email_subscriptions CASCADE;
DROP TABLE IF EXISTS public.email_send_log CASCADE;
DROP TABLE IF EXISTS public.email_send_state CASCADE;
DROP TABLE IF EXISTS public.suppressed_emails CASCADE;
DROP TABLE IF EXISTS public.email_unsubscribe_tokens CASCADE;

-- New: per-user security code (hashed)
CREATE TABLE public.user_security_codes (
  user_id UUID NOT NULL PRIMARY KEY,
  code_hash TEXT NOT NULL,
  code_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_security_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own row (just to check existence/updated_at)
CREATE POLICY "users read own security code"
ON public.user_security_codes FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own row (writes go through edge function with service role,
-- but allow update for client-side rotation flows that call edge functions).
-- Actual writes for hashing happen via edge function; no client INSERT/UPDATE policy needed.
CREATE POLICY "service role manages security codes"
ON public.user_security_codes FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admins read all security codes"
ON public.user_security_codes FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Reset attempt log (rate limiting)
CREATE TABLE public.security_code_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  succeeded BOOLEAN NOT NULL DEFAULT false,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sca_email_time ON public.security_code_attempts (lower(email), created_at DESC);

ALTER TABLE public.security_code_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages attempts"
ON public.security_code_attempts FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admins read attempts"
ON public.security_code_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger to bump updated_at
CREATE TRIGGER update_user_security_codes_updated_at
BEFORE UPDATE ON public.user_security_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();