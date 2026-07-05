-- Create the private bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service_documents', 'service_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Citizens can upload
CREATE POLICY "Citizens upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'service_documents' AND 
  owner = auth.uid() AND
  (path_tokens(name))[3] = auth.uid()::text
);

-- 2. Citizens can read own
CREATE POLICY "Citizens read own" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'service_documents' AND 
  owner = auth.uid()
);

-- 3. Operators can read assigned
CREATE POLICY "Operators read assigned" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'service_documents' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'operator' AND
  EXISTS (
    SELECT 1 FROM public.service_requests 
    WHERE id::text = (path_tokens(name))[2] 
    AND assigned_operator_id = auth.uid()
  )
);

-- 4. Admins can read all
CREATE POLICY "Admins read all" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'service_documents' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Note: We also need a DELETE policy for partial-failure cleanup by the Citizen
CREATE POLICY "Citizens delete own" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'service_documents' AND 
  owner = auth.uid()
);
