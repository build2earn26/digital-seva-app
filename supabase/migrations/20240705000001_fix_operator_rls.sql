-- Remove restrictive policy
DROP POLICY IF EXISTS "Operators read assigned requests" ON public.service_requests;

-- Allow Operators to SELECT their own assigned cases OR any pending cases in the queue
CREATE POLICY "Operators read queue" ON public.service_requests FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'operator'
  AND (status = 'pending' OR assigned_operator_id = auth.uid())
);

-- Allow Operators to UPDATE cases if they are pending or already assigned to them
CREATE POLICY "Operators update requests" ON public.service_requests FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'operator'
  AND (status = 'pending' OR assigned_operator_id = auth.uid())
) WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'operator'
);
