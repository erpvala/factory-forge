-- Keep public.users role/status aligned with approval decisions so login redirects
-- and dashboard access use the real approved role.

CREATE OR REPLACE FUNCTION public.sync_user_access_from_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  target_auth_id UUID;
  approved_role public.app_role;
  next_status TEXT := 'PENDING';
BEGIN
  target_auth_id := COALESCE(NEW.user_id, OLD.user_id);

  SELECT ur.role
  INTO approved_role
  FROM public.user_roles ur
  WHERE ur.user_id = target_auth_id
    AND ur.approval_status = 'approved'
  LIMIT 1;

  IF approved_role IS NOT NULL THEN
    next_status := 'ACTIVE';
  ELSIF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_auth_id
      AND ur.approval_status = 'pending'
  ) THEN
    next_status := 'PENDING';
  ELSIF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_auth_id
      AND ur.approval_status = 'rejected'
  ) THEN
    next_status := 'REJECTED';
  END IF;

  UPDATE public.users u
  SET status = next_status,
      role = COALESCE(approved_role, u.role)
  WHERE u.auth_id = target_auth_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_role_approval_changed ON public.user_roles;
DROP TRIGGER IF EXISTS on_role_access_changed ON public.user_roles;

CREATE TRIGGER on_role_access_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_access_from_roles();

CREATE OR REPLACE FUNCTION public.approve_role_request(request_id UUID, action approval_status)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'boss_owner') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'ceo')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: requires boss_owner, super_admin, or ceo role';
  END IF;

  SELECT * INTO req FROM public.role_requests WHERE id = request_id;

  IF req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  UPDATE public.role_requests
  SET status = action, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  INSERT INTO public.user_roles (user_id, role, approval_status)
  VALUES (req.user_id, req.requested_role, action)
  ON CONFLICT (user_id, role) DO UPDATE
  SET approval_status = EXCLUDED.approval_status;

  UPDATE public.users
  SET status = CASE
        WHEN action = 'approved' THEN 'ACTIVE'
        WHEN action = 'rejected' THEN 'REJECTED'
        ELSE status
      END,
      role = CASE
        WHEN action = 'approved' THEN req.requested_role
        ELSE role
      END
  WHERE auth_id = req.user_id;
END;
$$;

UPDATE public.users u
SET status = CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = u.auth_id
          AND ur.approval_status = 'approved'
      ) THEN 'ACTIVE'
      WHEN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = u.auth_id
          AND ur.approval_status = 'pending'
      ) THEN 'PENDING'
      WHEN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = u.auth_id
          AND ur.approval_status = 'rejected'
      ) THEN 'REJECTED'
      ELSE u.status
    END,
    role = COALESCE(
      (
        SELECT ur.role
        FROM public.user_roles ur
        WHERE ur.user_id = u.auth_id
          AND ur.approval_status = 'approved'
        LIMIT 1
      ),
      u.role
    );