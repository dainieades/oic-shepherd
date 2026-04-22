-- approved_emails: controls who can sign in to the app
-- Only emails on this list can access the app after authenticating.

CREATE TABLE IF NOT EXISTS public.approved_emails (
  email  text PRIMARY KEY,
  label  text,                          -- optional display name (e.g. "Tyler Levin")
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.approved_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_authenticated" ON public.approved_emails;
CREATE POLICY "select_authenticated" ON public.approved_emails
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_write" ON public.approved_emails;
CREATE POLICY "admin_write" ON public.approved_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.personas
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
