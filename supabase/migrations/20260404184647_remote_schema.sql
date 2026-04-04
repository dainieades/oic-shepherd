drop extension if exists "pg_net";

alter table "public"."families" add column "created_at" timestamp with time zone default now();

alter table "public"."families" add column "created_by" text;

alter table "public"."notes" disable row level security;

alter table "public"."people" drop column "medical_note";

alter table "public"."people" add column "app_role" text default 'no-access'::text;

alter table "public"."people" add column "created_by" text;

alter table "public"."people" add column "is_being_discipled" boolean default false;

alter table "public"."people" add column "physical_needs" text;

alter table "public"."people" add column "spiritual_needs" text;

alter table "public"."todos" disable row level security;


