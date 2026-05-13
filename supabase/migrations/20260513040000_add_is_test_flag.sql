-- ============================================================
-- Add is_test flag to people, personas, families, groups so that
-- hidden test accounts can be filtered out of real-user views.
-- ============================================================

alter table people    add column if not exists is_test boolean not null default false;
alter table personas  add column if not exists is_test boolean not null default false;
alter table families  add column if not exists is_test boolean not null default false;
alter table groups    add column if not exists is_test boolean not null default false;

create index if not exists people_is_test_idx   on people(is_test)   where is_test;
create index if not exists personas_is_test_idx on personas(is_test) where is_test;
