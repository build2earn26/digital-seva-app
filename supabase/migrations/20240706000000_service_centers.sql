-- Enable extensions for geolocation
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Create service_centers table
CREATE TABLE IF NOT EXISTS public.service_centers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  district text NOT NULL,
  mandal text NOT NULL,
  village_or_town text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for service_centers
ALTER TABLE public.service_centers ENABLE ROW LEVEL SECURITY;

-- Admins and operators can manage centers
CREATE POLICY "Admins and operators can manage centers" 
  ON public.service_centers
  FOR ALL 
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operator')
  );

-- Citizens can read active centers
CREATE POLICY "Anyone can read active centers"
  ON public.service_centers
  FOR SELECT
  USING (is_active = true);

-- Create mapping table
CREATE TABLE IF NOT EXISTS public.service_center_mappings (
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  center_id uuid REFERENCES public.service_centers(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (service_id, center_id)
);

-- Enable RLS for mappings
ALTER TABLE public.service_center_mappings ENABLE ROW LEVEL SECURITY;

-- Admins and operators can manage mappings
CREATE POLICY "Admins and operators can manage mappings"
  ON public.service_center_mappings
  FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'operator')
  );

-- Citizens can read mappings
CREATE POLICY "Anyone can read mappings"
  ON public.service_center_mappings
  FOR SELECT
  USING (true);

-- Add center_id to service_requests
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.service_centers(id);

-- Optional: Create an index for earthdistance queries if performance becomes an issue
-- CREATE INDEX idx_centers_location ON public.service_centers USING gist (ll_to_earth(latitude, longitude));
