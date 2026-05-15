


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."approved_emails" (
    "email" "text" NOT NULL,
    "label" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "person_id" "text"
);


ALTER TABLE "public"."approved_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "person_id" "text" NOT NULL,
    "changed_by_persona_id" "text" NOT NULL,
    "changed_by_name" "text" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."families" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "photo" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "child_count" integer,
    "primary_contact_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "original_photo" "text",
    "is_test" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."families" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_members" (
    "family_id" "text" NOT NULL,
    "person_id" "text" NOT NULL
);


ALTER TABLE "public"."family_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "text" NOT NULL,
    "person_id" "text" NOT NULL
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "leader_ids" "text"[] DEFAULT '{}'::"text"[],
    "related_family_ids" "text"[] DEFAULT '{}'::"text"[],
    "is_test" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "text" NOT NULL,
    "person_id" "text",
    "family_id" "text",
    "type" "text" NOT NULL,
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    "contact_method" "text",
    "content" "text",
    "mentions" "text"[] DEFAULT '{}'::"text"[],
    "created_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "todo_id" "text"
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notices" (
    "id" "text" NOT NULL,
    "person_id" "text",
    "family_id" "text",
    "urgency" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "privacy" "text" DEFAULT 'pastor-and-shepherds'::"text" NOT NULL,
    "categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."notices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."people" (
    "id" "text" NOT NULL,
    "photo" "text",
    "gender" "text",
    "marital_status" "text",
    "birthday" "text",
    "baptism_date" "text",
    "membership_date" "text",
    "anniversary" "text",
    "phone" "text",
    "home_phone" "text",
    "email" "text",
    "home_address" "text",
    "is_shepherd" boolean DEFAULT false,
    "church_positions" "text"[] DEFAULT '{}'::"text"[],
    "membership_status" "text" NOT NULL,
    "family_id" "text",
    "last_contact_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_being_discipled" boolean DEFAULT false,
    "app_role" "text" DEFAULT 'no-access'::"text",
    "created_by" "text",
    "church_attendance" "text" DEFAULT 'regular'::"text" NOT NULL,
    "language" "text" DEFAULT '["English"]'::"text" NOT NULL,
    "last_edited_at" timestamp with time zone,
    "last_edited_by_name" "text",
    "original_photo" "text",
    "preferred_name" "text" NOT NULL,
    "last_name" "text",
    "alternative_name" "text",
    "is_student" boolean DEFAULT false,
    "is_test" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."people" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."person_shepherds" (
    "person_id" "text" NOT NULL,
    "shepherd_id" "text" NOT NULL
);


ALTER TABLE "public"."person_shepherds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."persona_people" (
    "persona_id" "text" NOT NULL,
    "person_id" "text" NOT NULL
);


ALTER TABLE "public"."persona_people" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personas" (
    "id" "text" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "role" "text" DEFAULT 'shepherd'::"text" NOT NULL,
    "person_id" "text",
    "theme_preference" "text",
    "map_provider" "text",
    "email" "text",
    "calendar_sync_enabled" boolean DEFAULT false NOT NULL,
    "calendar_feed_token" "text",
    "calendar_connected_app" "text",
    "notify_person_added" boolean DEFAULT true NOT NULL,
    "notify_notice_added" boolean DEFAULT true NOT NULL,
    "notify_shepherd_assigned" boolean DEFAULT true NOT NULL,
    "notify_person_updated" boolean DEFAULT true NOT NULL,
    "notify_todo_created" boolean DEFAULT true NOT NULL,
    "is_test" boolean DEFAULT false NOT NULL,
    CONSTRAINT "personas_map_provider_check" CHECK (("map_provider" = ANY (ARRAY['apple'::"text", 'google'::"text", 'waze'::"text"]))),
    CONSTRAINT "personas_theme_preference_check" CHECK (("theme_preference" = ANY (ARRAY['light'::"text", 'dark'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."personas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" "text" NOT NULL,
    "person_id" "text",
    "family_id" "text",
    "todo_type" "text",
    "title" "text" NOT NULL,
    "due_date" timestamp with time zone,
    "repeat" "text",
    "alert" "text",
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "end_date" timestamp with time zone,
    "reminder_due_at" timestamp with time zone,
    "reminder_sent_at" timestamp with time zone,
    "reminder" "text"
);


ALTER TABLE "public"."todos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visitor_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_by" "text",
    "source" "text" NOT NULL,
    "status" "text" NOT NULL,
    "person_id" "text",
    "preferred_name" "text" NOT NULL,
    "last_name" "text",
    "phone" "text",
    "email" "text",
    "is_student" boolean DEFAULT false NOT NULL,
    "languages" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "referral_source" "text",
    "referral_detail" "text",
    "interests" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "prayer_request" "text",
    "alternative_name" "text",
    CONSTRAINT "visitor_submissions_referral_source_check" CHECK (("referral_source" = ANY (ARRAY['flyer'::"text", 'online'::"text", 'drive-by'::"text", 'school'::"text", 'friend'::"text", 'other'::"text"]))),
    CONSTRAINT "visitor_submissions_source_check" CHECK (("source" = ANY (ARRAY['app'::"text", 'qr'::"text"]))),
    CONSTRAINT "visitor_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'promoted'::"text", 'discarded'::"text"])))
);


ALTER TABLE "public"."visitor_submissions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."approved_emails"
    ADD CONSTRAINT "approved_emails_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_members"
    ADD CONSTRAINT "family_members_pkey" PRIMARY KEY ("family_id", "person_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "person_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."person_shepherds"
    ADD CONSTRAINT "person_shepherds_pkey" PRIMARY KEY ("person_id", "shepherd_id");



ALTER TABLE ONLY "public"."persona_people"
    ADD CONSTRAINT "persona_people_pkey" PRIMARY KEY ("persona_id", "person_id");



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visitor_submissions"
    ADD CONSTRAINT "visitor_submissions_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_logs_person_id_idx" ON "public"."audit_logs" USING "btree" ("person_id", "created_at" DESC);



CREATE INDEX "idx_notes_todo_id" ON "public"."notes" USING "btree" ("todo_id") WHERE ("todo_id" IS NOT NULL);



CREATE INDEX "idx_todos_reminder_due" ON "public"."todos" USING "btree" ("reminder_due_at") WHERE (("reminder_sent_at" IS NULL) AND ("completed" = false));



CREATE INDEX "people_is_test_idx" ON "public"."people" USING "btree" ("is_test") WHERE "is_test";



CREATE UNIQUE INDEX "personas_calendar_feed_token_idx" ON "public"."personas" USING "btree" ("calendar_feed_token") WHERE ("calendar_feed_token" IS NOT NULL);



CREATE INDEX "personas_is_test_idx" ON "public"."personas" USING "btree" ("is_test") WHERE "is_test";



CREATE INDEX "visitor_submissions_person_id_idx" ON "public"."visitor_submissions" USING "btree" ("person_id");



CREATE INDEX "visitor_submissions_status_idx" ON "public"."visitor_submissions" USING "btree" ("status", "submitted_at" DESC);



ALTER TABLE ONLY "public"."approved_emails"
    ADD CONSTRAINT "approved_emails_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_members"
    ADD CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_members"
    ADD CONSTRAINT "family_members_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."person_shepherds"
    ADD CONSTRAINT "person_shepherds_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."persona_people"
    ADD CONSTRAINT "persona_people_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."persona_people"
    ADD CONSTRAINT "persona_people_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visitor_submissions"
    ADD CONSTRAINT "visitor_submissions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can read audit logs" ON "public"."audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update visitor submissions" ON "public"."visitor_submissions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text")))));



CREATE POLICY "Anonymous can insert pending QR submissions" ON "public"."visitor_submissions" FOR INSERT TO "anon" WITH CHECK ((("source" = 'qr'::"text") AND ("status" = 'pending'::"text") AND ("person_id" IS NULL) AND ("submitted_by" IS NULL)));



CREATE POLICY "Authenticated users can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read visitor submissions" ON "public"."visitor_submissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = ANY (ARRAY['admin'::"text", 'shepherd'::"text", 'welcome-team'::"text"]))))));



CREATE POLICY "Welcome team and above can insert visitor submissions" ON "public"."visitor_submissions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = ANY (ARRAY['admin'::"text", 'shepherd'::"text", 'welcome-team'::"text"]))))));



CREATE POLICY "admin_delete_people" ON "public"."people" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text")))));



CREATE POLICY "admin_write" ON "public"."approved_emails" USING ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text")))));



ALTER TABLE "public"."approved_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_insert_people" ON "public"."people" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_personas" ON "public"."personas" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "authenticated_read_families" ON "public"."families" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_read_family_members" ON "public"."family_members" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_read_group_members" ON "public"."group_members" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_read_groups" ON "public"."groups" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_read_people" ON "public"."people" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_read_person_shepherds" ON "public"."person_shepherds" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_read_persona_people" ON "public"."persona_people" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_read_personas" ON "public"."personas" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_own_persona" ON "public"."personas" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL))) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "authenticated_write_families" ON "public"."families" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_family_members" ON "public"."family_members" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_group_members" ON "public"."group_members" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_groups" ON "public"."groups" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_person_shepherds" ON "public"."person_shepherds" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_write_persona_people" ON "public"."persona_people" USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."families" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notes_delete" ON "public"."notes" FOR DELETE USING ((("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text"))))));



CREATE POLICY "notes_insert" ON "public"."notes" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1))));



CREATE POLICY "notes_select" ON "public"."notes" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text")))) OR ("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)) OR (("visibility" = 'public'::"text") AND ("person_id" IN ( SELECT "pp"."person_id"
   FROM ("public"."persona_people" "pp"
     JOIN "public"."personas" "p" ON (("p"."id" = "pp"."persona_id")))
  WHERE ("p"."user_id" = "auth"."uid"())))) OR (("visibility" = 'public'::"text") AND ("family_id" IN ( SELECT "f"."id"
   FROM ((("public"."families" "f"
     JOIN "public"."family_members" "fm" ON (("fm"."family_id" = "f"."id")))
     JOIN "public"."persona_people" "pp" ON (("pp"."person_id" = "fm"."person_id")))
     JOIN "public"."personas" "p" ON (("p"."id" = "pp"."persona_id")))
  WHERE ("p"."user_id" = "auth"."uid"())))))));



CREATE POLICY "notes_update" ON "public"."notes" FOR UPDATE USING (("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)));



ALTER TABLE "public"."notices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notices_delete" ON "public"."notices" FOR DELETE USING ((("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text"))))));



CREATE POLICY "notices_insert" ON "public"."notices" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1))));



CREATE POLICY "notices_select" ON "public"."notices" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text")))) OR ("privacy" = 'everyone'::"text") OR (("privacy" = 'pastor-and-shepherds'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = ANY (ARRAY['admin'::"text", 'shepherd'::"text"])))))))));



CREATE POLICY "notices_update" ON "public"."notices" FOR UPDATE USING ((("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."people" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."person_shepherds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."persona_people" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_authenticated" ON "public"."approved_emails" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "shepherds_admins_update_people" ON "public"."people" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = ANY (ARRAY['admin'::"text", 'shepherd'::"text"]))))) OR ("id" = ( SELECT "personas"."person_id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1))));



ALTER TABLE "public"."todos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "todos_delete" ON "public"."todos" FOR DELETE USING ((("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text"))))));



CREATE POLICY "todos_insert" ON "public"."todos" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1))));



CREATE POLICY "todos_select" ON "public"."todos" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text")))) OR ("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)) OR ("person_id" IN ( SELECT "pp"."person_id"
   FROM ("public"."persona_people" "pp"
     JOIN "public"."personas" "p" ON (("p"."id" = "pp"."persona_id")))
  WHERE ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "todos_update" ON "public"."todos" FOR UPDATE USING ((("created_by" = ( SELECT "personas"."id"
   FROM "public"."personas"
  WHERE ("personas"."user_id" = "auth"."uid"())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."user_id" = "auth"."uid"()) AND ("personas"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."visitor_submissions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."approved_emails" TO "anon";
GRANT ALL ON TABLE "public"."approved_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."approved_emails" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."families" TO "anon";
GRANT ALL ON TABLE "public"."families" TO "authenticated";
GRANT ALL ON TABLE "public"."families" TO "service_role";



GRANT ALL ON TABLE "public"."family_members" TO "anon";
GRANT ALL ON TABLE "public"."family_members" TO "authenticated";
GRANT ALL ON TABLE "public"."family_members" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."notices" TO "anon";
GRANT ALL ON TABLE "public"."notices" TO "authenticated";
GRANT ALL ON TABLE "public"."notices" TO "service_role";



GRANT ALL ON TABLE "public"."people" TO "anon";
GRANT ALL ON TABLE "public"."people" TO "authenticated";
GRANT ALL ON TABLE "public"."people" TO "service_role";



GRANT ALL ON TABLE "public"."person_shepherds" TO "anon";
GRANT ALL ON TABLE "public"."person_shepherds" TO "authenticated";
GRANT ALL ON TABLE "public"."person_shepherds" TO "service_role";



GRANT ALL ON TABLE "public"."persona_people" TO "anon";
GRANT ALL ON TABLE "public"."persona_people" TO "authenticated";
GRANT ALL ON TABLE "public"."persona_people" TO "service_role";



GRANT ALL ON TABLE "public"."personas" TO "anon";
GRANT ALL ON TABLE "public"."personas" TO "authenticated";
GRANT ALL ON TABLE "public"."personas" TO "service_role";



GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";



GRANT ALL ON TABLE "public"."visitor_submissions" TO "anon";
GRANT ALL ON TABLE "public"."visitor_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."visitor_submissions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































