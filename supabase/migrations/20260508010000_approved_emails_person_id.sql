-- Add person_id to approved_emails so invite flow can record the exact person
-- record being invited, preventing email-collision linking (e.g. shared family email).
ALTER TABLE public.approved_emails
  ADD COLUMN IF NOT EXISTS person_id text REFERENCES public.people(id) ON DELETE SET NULL;
