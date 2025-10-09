-- Criar função para verificar se usuário é membro da empresa
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND status = 'active'
  )
$$;

-- Remover policy problemática
DROP POLICY IF EXISTS "Members can view other members in their company" ON public.company_members;

-- Recriar policy usando a função security definer
CREATE POLICY "Members can view other members in their company"
ON public.company_members
FOR SELECT
USING (public.is_company_member(auth.uid(), company_id));