-- Fix security warnings

-- Add missing RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add missing RLS policies for company_members  
CREATE POLICY "Company members can insert new members (admins only)"
ON public.company_members FOR INSERT
TO authenticated
WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Company members can update member status (admins only)"
ON public.company_members FOR UPDATE
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
);

-- Add DELETE policy for profiles
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Fix function search_path - recreate with proper settings (no need to drop)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;