-- Align people-table column names with the UI labels:
--   english_name           → preferred_name + last_name (split on first space)
--   chinese_name           → alternative_name
-- Also drops two unused columns: is_first_time_visitor, is_child.

alter table "public"."people"
  add column if not exists preferred_name   text,
  add column if not exists last_name        text,
  add column if not exists alternative_name text;

update "public"."people"
set
  preferred_name = case
    when position(' ' in english_name) > 0
      then substring(english_name from 1 for position(' ' in english_name) - 1)
    else english_name
  end,
  last_name = case
    when position(' ' in english_name) > 0
      then substring(english_name from position(' ' in english_name) + 1)
    else null
  end,
  alternative_name = chinese_name
where preferred_name is null;

alter table "public"."people"
  alter column preferred_name set not null;

alter table "public"."people"
  drop column if exists english_name,
  drop column if exists chinese_name,
  drop column if exists is_first_time_visitor,
  drop column if exists is_child;
