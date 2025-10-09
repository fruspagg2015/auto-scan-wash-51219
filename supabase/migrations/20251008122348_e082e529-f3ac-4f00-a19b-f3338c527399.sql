-- Create enums for subscription and member status
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'professional', 'enterprise');
CREATE TYPE public.member_status AS ENUM ('active', 'invited', 'suspended');

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  subscription_plan subscription_plan NOT NULL DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Drop old unique constraint and create new one
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_company_id_role_key UNIQUE (user_id, company_id, role);

-- Create company_members table
CREATE TABLE public.company_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status member_status NOT NULL DEFAULT 'active',
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- Enable RLS on company_members
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Update has_role function to include company_id
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _company_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = _role
  )
$$;

-- Create function to get user's companies
CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
RETURNS TABLE (
  company_id uuid,
  company_name text,
  user_role app_role,
  member_status member_status
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as company_id,
    c.name as company_name,
    ur.role as user_role,
    cm.status as member_status
  FROM public.companies c
  INNER JOIN public.company_members cm ON c.id = cm.company_id
  INNER JOIN public.user_roles ur ON c.id = ur.company_id AND ur.user_id = cm.user_id
  WHERE cm.user_id = _user_id
    AND cm.status = 'active'
$$;

-- Create function to check if user is company admin
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = 'administrador'
  )
$$;

-- RLS Policies for companies
CREATE POLICY "Users can view their companies"
ON public.companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
  )
);

CREATE POLICY "Company admins can update their company"
ON public.companies
FOR UPDATE
USING (public.is_company_admin(auth.uid(), id));

CREATE POLICY "Users can create companies"
ON public.companies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for company_members
CREATE POLICY "Members can view other members in their company"
ON public.company_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = company_members.company_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
  )
);

CREATE POLICY "Company admins can manage members"
ON public.company_members
FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can join companies they were invited to"
ON public.company_members
FOR UPDATE
USING (user_id = auth.uid() AND status = 'invited');

-- Update RLS policies for user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view roles in their company"
ON public.user_roles
FOR SELECT
USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Company admins can manage roles in their company"
ON public.user_roles
FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Update handle_new_user function to create company and memberships
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Create a new company for the user
  INSERT INTO public.companies (name, email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    NEW.email
  )
  RETURNING id INTO new_company_id;
  
  -- Add user as company member
  INSERT INTO public.company_members (company_id, user_id, status, joined_at)
  VALUES (new_company_id, NEW.id, 'active', now());
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'administrador');
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating companies updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();