CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_prr_email_code ON public.password_reset_requests (lower(email), code) WHERE used = false;
CREATE INDEX idx_prr_expires ON public.password_reset_requests (expires_at);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service key)
CREATE POLICY "service role manages reset requests"
ON public.password_reset_requests
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');