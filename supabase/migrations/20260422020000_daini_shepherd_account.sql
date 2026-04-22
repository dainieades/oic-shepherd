-- Grants Daini Eades access to the app and creates her shepherd persona.
-- Without this: (1) her email wasn't in approved_emails so login was rejected,
-- and (2) no persona was linked to her person record, so the app fell back to
-- showing the default admin persona (Pastor Paul).

-- 1. Allow login with her Saviynt Google SSO address
INSERT INTO public.approved_emails (email, label)
VALUES ('daini.eades@saviynt.com', 'Daini Eades')
ON CONFLICT (email) DO NOTHING;

-- 2. Stamp her email on the people record so the auto-link path in
--    loginWithSupabaseUser can resolve person → persona on first sign-in
UPDATE public.people
SET email = 'daini.eades@saviynt.com', is_shepherd = true
WHERE id = 'daini-eades';

-- 3. Create her shepherd persona linked to her person record
INSERT INTO public.personas (id, name, role, person_id)
VALUES ('daini-eades', 'Daini Eades', 'shepherd', 'daini-eades')
ON CONFLICT (id) DO NOTHING;
