ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS location_name text;

-- Profiles table already has RLS. The update policy should allow users to update their own row.
-- Let's ensure the user can update their own profile.
CREATE POLICY "Users can update own profile location"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
