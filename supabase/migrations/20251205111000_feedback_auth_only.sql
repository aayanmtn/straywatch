-- Restrict feedback to authenticated users only
DROP POLICY IF EXISTS "Allow feedback inserts" ON public.feedback;
DROP POLICY IF EXISTS "Allow feedback select" ON public.feedback;

CREATE POLICY "Allow feedback inserts (auth only)" ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow feedback select (auth only)" ON public.feedback
  FOR SELECT
  TO authenticated
  USING (true);
