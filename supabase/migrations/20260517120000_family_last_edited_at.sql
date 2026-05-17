ALTER TABLE "public"."families"
  ADD COLUMN IF NOT EXISTS "last_edited_at" timestamp with time zone;
