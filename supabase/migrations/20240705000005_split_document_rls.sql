-- Split documents RLS policy into granular SELECT/INSERT/UPDATE/DELETE

-- 1. Drop the catch-all policy
DROP POLICY IF EXISTS "Citizen read/write own documents" ON public.documents;

-- 2. Create specific policies
CREATE POLICY "Citizen select own documents" 
  ON public.documents FOR SELECT 
  USING (uploaded_by = auth.uid());

CREATE POLICY "Citizen insert own documents" 
  ON public.documents FOR INSERT 
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Citizen update own documents" 
  ON public.documents FOR UPDATE 
  USING (uploaded_by = auth.uid()) 
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Citizen delete own documents" 
  ON public.documents FOR DELETE 
  USING (uploaded_by = auth.uid());
