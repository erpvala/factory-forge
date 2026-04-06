
-- Add columns the existing auth hook expects
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS force_logged_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
