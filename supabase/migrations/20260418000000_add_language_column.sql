alter table "public"."people"
  add column if not exists "language" text not null default '["English"]';
