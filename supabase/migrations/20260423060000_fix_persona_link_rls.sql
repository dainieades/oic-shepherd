-- Fix: allow a first-time sign-in to stamp user_id on an unlinked persona.
--
-- The old policy required user_id = auth.uid() in the USING clause, which
-- blocked the initial linking of a seeded persona (user_id IS NULL) to the
-- newly signed-in auth user. loginWithSupabaseUser would silently fail to
-- update, leaving the persona un-linked and admin actions broken.
--
-- The new policy:
--   USING  — persona is eligible for update if it belongs to this user OR is unowned
--   WITH CHECK — after update, user_id must equal auth.uid() (can't set to someone else's id)

DROP POLICY IF EXISTS "authenticated_update_own_persona" ON personas;

CREATE POLICY "authenticated_update_own_persona" ON personas
  FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());
