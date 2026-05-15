-- Remove the welcome-team role in favor of a per-shepherd triage flag.
-- Anyone who was welcome-team becomes a shepherd with triage rights.

ALTER TABLE "public"."people"
  ADD COLUMN IF NOT EXISTS "can_triage_visitors" boolean NOT NULL DEFAULT false;

UPDATE "public"."people"
  SET "app_role" = 'shepherd',
      "can_triage_visitors" = true
  WHERE "app_role" = 'welcome-team';

UPDATE "public"."personas"
  SET "role" = 'shepherd'
  WHERE "role" = 'welcome-team';

DROP POLICY IF EXISTS "Authenticated users can read visitor submissions" ON "public"."visitor_submissions";
CREATE POLICY "Authenticated users can read visitor submissions"
  ON "public"."visitor_submissions"
  FOR SELECT
  USING ((EXISTS (
    SELECT 1
    FROM "public"."personas"
    WHERE (("personas"."user_id" = "auth"."uid"())
      AND ("personas"."role" = ANY (ARRAY['admin'::"text", 'shepherd'::"text"]))))));

DROP POLICY IF EXISTS "Welcome team and above can insert visitor submissions" ON "public"."visitor_submissions";
CREATE POLICY "Authenticated users can insert visitor submissions"
  ON "public"."visitor_submissions"
  FOR INSERT
  WITH CHECK ((EXISTS (
    SELECT 1
    FROM "public"."personas"
    WHERE (("personas"."user_id" = "auth"."uid"())
      AND ("personas"."role" = ANY (ARRAY['admin'::"text", 'shepherd'::"text"]))))));
