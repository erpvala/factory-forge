-- ============================================================
-- AUTH SYSTEM: users + sessions tables
-- Production-ready auth with role, status, and session tracking
-- ============================================================

-- ─── users table ─────────────────────────────────────────────
-- Mirrors auth.users with extra business fields (role, status).
-- Linked via user_id → auth.users(id) for Supabase auth integration.
CREATE TABLE IF NOT EXISTS public.users (
  user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  -- password_hash is stored by Supabase auth.users; this column holds
  -- a bcrypt copy for direct DB queries / Edge Function validation.
  password_hash TEXT NOT NULL,
  role        public.app_role NOT NULL DEFAULT 'user',
  status      TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','ACTIVE','REJECTED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth_id = auth.uid());

-- Service role / edge functions bypass RLS
CREATE POLICY "users_service_role_all"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for fast email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users (auth_id);

-- ─── sessions table ──────────────────────────────────────────
-- Stores active JWT sessions. Useful for force-logout, audit, etc.
CREATE TABLE IF NOT EXISTS public.sessions (
  session_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,          -- Supabase access token
  expiry      TIMESTAMPTZ NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own"
  ON public.sessions FOR SELECT
  USING (
    user_id = (
      SELECT user_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "sessions_service_role_all"
  ON public.sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry  ON public.sessions (expiry);

-- ─── rate_limits table ───────────────────────────────────────
-- Tracks failed login attempts per IP for rate-limiting.
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier  TEXT NOT NULL,                 -- IP address or email
  attempts    INT NOT NULL DEFAULT 1,
  first_attempt TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt  TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ
);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_service_role_all"
  ON public.auth_rate_limits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier
  ON public.auth_rate_limits (identifier);

-- ─── Auto-sync: when Supabase creates a new auth user, mirror it ──
-- This trigger fires when a user registers via Supabase auth.
-- It populates public.users with default values so the row always exists.
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, name, email, password_hash, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    -- Store a sentinel value; real hash is in auth.users
    '$supabase$native_auth$' || NEW.id::text,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.app_role,
      'user'
    ),
    'PENDING'
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_created();

-- ─── Function: activate user after admin approval ─────────────
CREATE OR REPLACE FUNCTION public.activate_user(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.users SET status = 'ACTIVE' WHERE user_id = _user_id;
  -- Also mark their primary role as approved
  UPDATE public.user_roles
    SET approval_status = 'approved'
  WHERE user_id = (SELECT auth_id FROM public.users WHERE user_id = _user_id);
END;
$$;

-- ─── Function: clean up expired sessions (run via cron) ───────
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sessions WHERE expiry < now();
END;
$$;

-- ─── Function: resolve user status from approval ──────────────
-- Keeps public.users.status in sync with user_roles.approval_status
CREATE OR REPLACE FUNCTION public.sync_user_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status = 'approved' THEN
    UPDATE public.users SET status = 'ACTIVE'
    WHERE auth_id = NEW.user_id;
  ELSIF NEW.approval_status = 'rejected' THEN
    UPDATE public.users SET status = 'REJECTED'
    WHERE auth_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_role_approval_changed ON public.user_roles;
CREATE TRIGGER on_role_approval_changed
  AFTER UPDATE OF approval_status ON public.user_roles
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_status();
