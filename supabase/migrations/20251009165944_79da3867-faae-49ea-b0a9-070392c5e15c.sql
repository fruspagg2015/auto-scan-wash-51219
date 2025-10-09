-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de tabelas de preços
CREATE TABLE IF NOT EXISTS public.price_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens da tabela de preços
CREATE TABLE IF NOT EXISTS public.price_table_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_table_id UUID NOT NULL REFERENCES public.price_tables(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(price_table_id, service_id)
);

-- Criar enum para dias da semana
CREATE TYPE public.day_of_week AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- Criar tabela de promoções
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  days_of_week public.day_of_week[] DEFAULT ARRAY[]::public.day_of_week[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de serviços incluídos na promoção
CREATE TABLE IF NOT EXISTS public.promotion_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promotion_id, service_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_table_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para services
CREATE POLICY "Users can view services from their company"
ON public.services FOR SELECT
USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Políticas RLS para price_tables
CREATE POLICY "Users can view price tables from their company"
ON public.price_tables FOR SELECT
USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage price tables"
ON public.price_tables FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Políticas RLS para price_table_items
CREATE POLICY "Users can view price table items from their company"
ON public.price_table_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.price_tables pt
  WHERE pt.id = price_table_items.price_table_id
  AND public.is_company_member(auth.uid(), pt.company_id)
));

CREATE POLICY "Admins can manage price table items"
ON public.price_table_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.price_tables pt
  WHERE pt.id = price_table_items.price_table_id
  AND public.is_company_admin(auth.uid(), pt.company_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.price_tables pt
  WHERE pt.id = price_table_items.price_table_id
  AND public.is_company_admin(auth.uid(), pt.company_id)
));

-- Políticas RLS para promotions
CREATE POLICY "Users can view promotions from their company"
ON public.promotions FOR SELECT
USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage promotions"
ON public.promotions FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Políticas RLS para promotion_services
CREATE POLICY "Users can view promotion services from their company"
ON public.promotion_services FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.promotions p
  WHERE p.id = promotion_services.promotion_id
  AND public.is_company_member(auth.uid(), p.company_id)
));

CREATE POLICY "Admins can manage promotion services"
ON public.promotion_services FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.promotions p
  WHERE p.id = promotion_services.promotion_id
  AND public.is_company_admin(auth.uid(), p.company_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.promotions p
  WHERE p.id = promotion_services.promotion_id
  AND public.is_company_admin(auth.uid(), p.company_id)
));

-- Triggers para atualizar updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_tables_updated_at
  BEFORE UPDATE ON public.price_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();