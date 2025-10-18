
-- Add user_role column to company_members (now that enum values exist)
ALTER TABLE public.company_members 
ADD COLUMN user_role app_role NOT NULL DEFAULT 'atendente';

-- Create function to get user companies with their roles
CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
RETURNS TABLE (
  company_id uuid,
  company_name varchar,
  user_role app_role,
  member_status member_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as company_id,
    c.name as company_name,
    cm.user_role,
    cm.status as member_status
  FROM public.company_members cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.user_id = _user_id
  ORDER BY c.created_at;
$$;

-- Update existing member to be administrator
UPDATE public.company_members 
SET user_role = 'administrador'
WHERE user_id = 'aa4087d0-a76b-4af7-843f-81f297ebdb24';
