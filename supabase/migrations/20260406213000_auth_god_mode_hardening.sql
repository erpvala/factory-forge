-- ============================================================
-- AUTH GOD MODE HARDENING (additive migration)
-- Adds: refresh/session controls, devices, login history, 2FA, email verify,
--       lock controls, activity monitoring
-- ============================================================

-- ─── users table security fields ─────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lock_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_method TEXT CHECK (two_factor_method IN ('otp', 'totp')),
  ADD COLUMN IF NOT EXISTS suspicious_score INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_lock_until ON public.users (lock_until);
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON public.users (email_verified_at);

-- ─── sessions table hardening fields ─────────────────────────
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS device_id UUID,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions (refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active_at ON public.sessions (last_active_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at ON public.sessions (revoked_at);

-- ─── apply flow compatibility schema (micro) ──────────────────────
-- Canonical business view of applications while keeping existing role_requests flow.
CREATE TABLE IF NOT EXISTS public.applications (
  app_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  role_type TEXT NOT NULL,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications (created_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'applications_service_role_all'
  ) THEN
    CREATE POLICY "applications_service_role_all"
      ON public.applications FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Keep applications table synced from existing role_requests lifecycle.
CREATE OR REPLACE FUNCTION public.sync_role_request_to_applications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  mapped_status TEXT;
BEGIN
  mapped_status := CASE
    WHEN NEW.status = 'approved' THEN 'APPROVED'
    WHEN NEW.status = 'rejected' THEN 'REJECTED'
    ELSE 'PENDING'
  END;

  INSERT INTO public.applications (app_id, user_id, role_type, data_json, status, created_at, reviewed_at, reviewed_by)
  VALUES (
    NEW.id,
    NEW.user_id,
    NEW.requested_role,
    COALESCE(NEW.application_data, '{}'::jsonb),
    mapped_status,
    COALESCE(NEW.created_at, now()),
    NEW.reviewed_at,
    NEW.reviewed_by
  )
  ON CONFLICT (app_id)
  DO UPDATE SET
    role_type = EXCLUDED.role_type,
    data_json = EXCLUDED.data_json,
    status = EXCLUDED.status,
    reviewed_at = EXCLUDED.reviewed_at,
    reviewed_by = EXCLUDED.reviewed_by;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_role_request_to_applications ON public.role_requests;
CREATE TRIGGER trg_sync_role_request_to_applications
AFTER INSERT OR UPDATE ON public.role_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_role_request_to_applications();

-- Backfill historical role requests.
INSERT INTO public.applications (app_id, user_id, role_type, data_json, status, created_at, reviewed_at, reviewed_by)
SELECT
  rr.id,
  rr.user_id,
  rr.requested_role,
  COALESCE(rr.application_data, '{}'::jsonb),
  CASE
    WHEN rr.status = 'approved' THEN 'APPROVED'
    WHEN rr.status = 'rejected' THEN 'REJECTED'
    ELSE 'PENDING'
  END,
  rr.created_at,
  rr.reviewed_at,
  rr.reviewed_by
FROM public.role_requests rr
ON CONFLICT (app_id) DO NOTHING;

-- ─── device management ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_devices (
  device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  last_login TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_devices_select_own"
  ON public.user_devices FOR SELECT
  USING (
    user_id = (
      SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "user_devices_service_role_all"
  ON public.user_devices FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices (user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_login ON public.user_devices (last_login);

-- ─── login history / audit ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  email TEXT,
  ip INET,
  location TEXT,
  device TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_logs_select_own"
  ON public.login_logs FOR SELECT
  USING (
    user_id = (
      SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "login_logs_service_role_all"
  ON public.login_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_time ON public.login_logs (timestamp DESC);

-- ─── email verification support ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expiry TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_verifications_service_role_all"
  ON public.email_verifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expiry ON public.email_verifications (expiry);

-- ─── OTP / 2FA challenge table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.otp_challenges (
  challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  expiry TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "otp_challenges_service_role_all"
  ON public.otp_challenges FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_otp_challenges_user_id ON public.otp_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_expiry ON public.otp_challenges (expiry);

-- ─── activity monitor events ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ip_address INET,
  device TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_events_service_role_all"
  ON public.activity_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON public.activity_events (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_time ON public.activity_events (created_at DESC);

-- ─── helper: auto-revoke stale sessions (inactive > 30 days) ─
CREATE OR REPLACE FUNCTION public.revoke_inactive_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.sessions
  SET revoked_at = now(), revoked_reason = 'inactive_timeout'
  WHERE revoked_at IS NULL
    AND last_active_at < (now() - interval '30 days');
END;
$$;

-- ─── helper: lock account after suspicious threshold ─────────
CREATE OR REPLACE FUNCTION public.lock_user_temporarily(_user_id UUID, _minutes INT, _reason TEXT DEFAULT 'suspicious_activity')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET lock_until = now() + make_interval(mins => _minutes),
      suspicious_score = suspicious_score + 1,
      status = CASE WHEN suspicious_score + 1 >= 5 THEN 'REJECTED' ELSE status END
  WHERE user_id = _user_id;

  INSERT INTO public.activity_events (user_id, event_type, risk_level, metadata)
  VALUES (_user_id, 'account_locked', 'high', jsonb_build_object('reason', _reason, 'minutes', _minutes));
END;
$$;
