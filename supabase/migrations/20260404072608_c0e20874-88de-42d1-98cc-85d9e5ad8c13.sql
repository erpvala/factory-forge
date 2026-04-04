
-- Create app_role enum with all roles
CREATE TYPE public.app_role AS ENUM (
  'boss_owner', 'ceo', 'super_admin', 'admin',
  'developer', 'franchise_owner', 'franchise_manager', 'reseller', 'reseller_manager',
  'influencer', 'influencer_manager', 'lead_manager', 'marketing_manager',
  'seo_manager', 'sales_support', 'finance_manager', 'legal_manager',
  'hr_manager', 'pro_manager', 'task_manager', 'product_manager',
  'demo_manager', 'server_manager', 'api_ai_manager',
  'continent_admin', 'country_admin', 'security_manager',
  'marketplace_manager', 'license_manager', 'deployment_manager',
  'analytics_manager', 'notification_manager', 'integration_manager',
  'audit_manager', 'prime_user', 'user'
);

-- Create approval_status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Boss can manage all roles
CREATE POLICY "Boss can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'boss_owner'));

-- Role requests table (for approval workflow)
CREATE TABLE public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role app_role NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.role_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create requests" ON public.role_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Boss can view all requests" ON public.role_requests FOR SELECT USING (public.has_role(auth.uid(), 'boss_owner'));
CREATE POLICY "Boss can update requests" ON public.role_requests FOR UPDATE USING (public.has_role(auth.uid(), 'boss_owner'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Approve role request function
CREATE OR REPLACE FUNCTION public.approve_role_request(request_id UUID, action approval_status)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  -- Only boss_owner can approve
  IF NOT public.has_role(auth.uid(), 'boss_owner') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO req FROM public.role_requests WHERE id = request_id;
  
  IF req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Update request status
  UPDATE public.role_requests 
  SET status = action, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  -- If approved, grant the role
  IF action = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (req.user_id, req.requested_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
