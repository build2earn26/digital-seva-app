-- Fix RLS for Document Vault (where request_id is null)

-- Drop the old policy
DROP POLICY IF EXISTS "Citizen read/write own documents" ON public.documents;

-- Create a new policy that relies on uploaded_by directly, which covers both vault and request documents
CREATE POLICY "Citizen read/write own documents" ON public.documents
  FOR ALL USING (uploaded_by = auth.uid());
