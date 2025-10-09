-- Criar empresa, vínculo e role para usuário existente
DO $$
DECLARE
  v_user_id uuid := '43717d62-2bae-4da0-b8ec-11182c66bce6';
  v_company_id uuid;
BEGIN
  -- Criar empresa para o usuário
  INSERT INTO public.companies (name, email)
  VALUES ('Minha Empresa', 'fabio.frconnect@gmail.com')
  RETURNING id INTO v_company_id;
  
  -- Adicionar usuário como membro da empresa
  INSERT INTO public.company_members (company_id, user_id, status, joined_at)
  VALUES (v_company_id, v_user_id, 'active', now());
  
  -- Atribuir role de administrador
  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (v_user_id, v_company_id, 'administrador');
END $$;

-- Verificar e corrigir o trigger handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();