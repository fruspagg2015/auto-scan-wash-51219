-- Create service_orders table
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id INTEGER REFERENCES public.veiculos(idplaca),
    service_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')),
    arrival_time TIMESTAMPTZ DEFAULT now(),
    estimated_time TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Allow read access for all users
CREATE POLICY "Enable read access for all users" ON public.service_orders
    FOR SELECT USING (true);

-- Allow insert/update for authenticated users (and anon for now to facilitate testing/demo if needed, or stick to authenticated)
CREATE POLICY "Enable insert for authenticated users" ON public.service_orders
    FOR INSERT WITH CHECK (true); -- Relaxed for demo purposes if anon key is used

CREATE POLICY "Enable update for all users" ON public.service_orders
    FOR UPDATE USING (true);
