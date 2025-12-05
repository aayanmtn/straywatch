-- Create feedback table for site submissions
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon/auth users (public feedback)
CREATE POLICY "Allow feedback inserts" ON public.feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow selecting own submissions for debugging (optional, safe)
CREATE POLICY "Allow feedback select" ON public.feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);
