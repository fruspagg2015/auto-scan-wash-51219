-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create subscription plan and status enums
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'professional', 'enterprise');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trial');

-- Create member_status enum
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'pending');

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  cnpj VARCHAR(18),
  logo_url TEXT,
  subscription_plan public.subscription_plan DEFAULT 'basic',
  subscription_status public.subscription_status DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_members table
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.member_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_members_company ON public.company_members(company_id);
CREATE INDEX idx_company_members_user ON public.company_members(user_id);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  cpf VARCHAR(14),
  tipo VARCHAR(50) DEFAULT 'Pessoa Física',
  status VARCHAR(20) DEFAULT 'Ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_telefone ON public.clients(telefone);

-- Create veiculos table
CREATE TABLE public.veiculos (
  idplaca SERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca VARCHAR(50),
  modelo VARCHAR(100),
  submodelo VARCHAR(100),
  versao VARCHAR(100),
  ano VARCHAR(4),
  anoModelo VARCHAR(4),
  cor VARCHAR(30),
  datainclusao TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Fortaleza'),
  municipio VARCHAR(100),
  uf VARCHAR(2)
);

CREATE INDEX idx_veiculos_placa ON public.veiculos(placa);

-- Create clientes_veiculos junction table
CREATE TABLE public.clientes_veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  veiculo_idplaca INTEGER NOT NULL REFERENCES public.veiculos(idplaca) ON DELETE CASCADE,
  data_vinculo TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'America/Fortaleza'),
  observacoes TEXT,
  UNIQUE(cliente_id, veiculo_idplaca)
);

CREATE INDEX idx_clientes_veiculos_cliente ON public.clientes_veiculos(cliente_id);
CREATE INDEX idx_clientes_veiculos_veiculo ON public.clientes_veiculos(veiculo_idplaca);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_veiculos ENABLE ROW LEVEL SECURITY;

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- RLS Policies for companies
CREATE POLICY "Users can view their companies"
ON public.companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = companies.id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

-- RLS Policies for company_members
CREATE POLICY "Users can view members of their companies"
ON public.company_members FOR SELECT
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for clients
CREATE POLICY "Company members can view their company clients"
ON public.clients FOR SELECT
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Company members can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Company members can update their company clients"
ON public.clients FOR UPDATE
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
);

-- RLS Policies for veiculos
CREATE POLICY "Authenticated users can view vehicles"
ON public.veiculos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
ON public.veiculos FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for clientes_veiculos
CREATE POLICY "Company members can view their client vehicles"
ON public.clientes_veiculos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = clientes_veiculos.cliente_id
    AND public.is_company_member(auth.uid(), c.company_id)
  )
);

CREATE POLICY "Company members can insert client vehicles"
ON public.clientes_veiculos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = clientes_veiculos.cliente_id
    AND public.is_company_member(auth.uid(), c.company_id)
  )
);

CREATE POLICY "Company members can delete client vehicles"
ON public.clientes_veiculos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = clientes_veiculos.cliente_id
    AND public.is_company_member(auth.uid(), c.company_id)
  )
);

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();