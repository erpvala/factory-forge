-- Add application_data column to role_requests for storing role-specific form data
ALTER TABLE public.role_requests
  ADD COLUMN IF NOT EXISTS application_data JSONB DEFAULT NULL;

-- Index for faster boss panel queries
CREATE INDEX IF NOT EXISTS idx_role_requests_status ON public.role_requests (status);
CREATE INDEX IF NOT EXISTS idx_role_requests_user_id ON public.role_requests (user_id);

-- Allow boss to manage all applications through RPC (approve_role_request already exists)
-- Ensure approve_role_request also updates user_roles.approval_status on the row
CREATE OR REPLACE FUNCTION public.approve_role_request(request_id UUID, action approval_status)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  -- Only boss_owner or super_admin can approve
  IF NOT (public.has_role(auth.uid(), 'boss_owner') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'ceo')) THEN
    RAISE EXCEPTION 'Unauthorized: requires boss_owner, super_admin, or ceo role';
  END IF;

  SELECT * INTO req FROM public.role_requests WHERE id = request_id;
  
  IF req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Update request status
  UPDATE public.role_requests 
  SET status = action, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  IF action = 'approved' THEN
    -- Grant the role
    INSERT INTO public.user_roles (user_id, role, approval_status)
    VALUES (req.user_id, req.requested_role, 'approved')
    ON CONFLICT (user_id, role) DO UPDATE SET approval_status = 'approved';
  ELSIF action = 'rejected' THEN
    -- Mark role as rejected
    UPDATE public.user_roles
    SET approval_status = 'rejected'
    WHERE user_id = req.user_id AND role = req.requested_role;
  END IF;
END;
$$;

-- Grant the profiles join for boss panel
CREATE POLICY IF NOT EXISTS "Boss can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'boss_owner') OR public.has_role(auth.uid(), 'super_admin'));
