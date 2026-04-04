-- ============================================================
-- OIC Shepherd — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── People ───────────────────────────────────────────────────
create table if not exists people (
  id                      text primary key,
  english_name            text not null,
  chinese_name            text,
  photo                   text,
  gender                  text,
  marital_status          text,
  birthday                text,           -- YYYY-MM-DD
  baptism_date            text,           -- YYYY-MM-DD
  membership_date         text,           -- YYYY-MM-DD
  anniversary             text,           -- YYYY-MM-DD
  phone                   text,
  home_phone              text,
  email                   text,
  home_address            text,
  medical_note            text,
  is_shepherd             boolean default false,
  church_positions        text[] default '{}',
  membership_status       text not null,
  language                text not null default 'english',
  family_id               text,
  follow_up_frequency_days integer default 14,
  last_contact_date       timestamptz,
  next_follow_up_date     timestamptz,
  is_first_time_visitor   boolean,
  is_child                boolean,
  created_at              timestamptz default now()
);

-- ── Families ─────────────────────────────────────────────────
create table if not exists families (
  id                  text primary key,
  label               text not null,
  photo               text,
  tags                text[] default '{}',
  child_count         integer,
  primary_contact_id  text
);

create table if not exists family_members (
  family_id  text references families(id) on delete cascade,
  person_id  text references people(id)   on delete cascade,
  primary key (family_id, person_id)
);

-- ── Groups ───────────────────────────────────────────────────
create table if not exists groups (
  id                  text primary key,
  name                text not null,
  description         text,
  leader_ids          text[] default '{}',
  related_family_ids  text[] default '{}'
);

create table if not exists group_members (
  group_id   text references groups(id)  on delete cascade,
  person_id  text references people(id)  on delete cascade,
  primary key (group_id, person_id)
);

-- ── Personas (shepherd roles) ─────────────────────────────────
create table if not exists personas (
  id         text primary key,
  user_id    uuid references auth.users(id) on delete set null,
  name       text not null,
  role       text not null default 'shepherd',
  person_id  text references people(id) on delete set null
);

-- Maps a persona to the people they shepherd
create table if not exists persona_people (
  persona_id  text references personas(id)  on delete cascade,
  person_id   text references people(id)    on delete cascade,
  primary key (persona_id, person_id)
);

-- Maps a person to all their shepherds (persona ids)
create table if not exists person_shepherds (
  person_id   text references people(id)   on delete cascade,
  shepherd_id text not null,               -- persona id
  primary key (person_id, shepherd_id)
);

-- ── Notes ────────────────────────────────────────────────────
create table if not exists notes (
  id              text primary key,
  person_id       text references people(id)   on delete cascade,
  family_id       text references families(id) on delete cascade,
  type            text not null,
  visibility      text not null default 'private',
  contact_method  text,
  content         text,
  mentions        text[] default '{}',
  created_by      text not null,            -- persona id
  created_at      timestamptz default now()
);

-- ── Todos ─────────────────────────────────────────────────────
create table if not exists todos (
  id            text primary key,
  person_id     text references people(id)   on delete cascade,
  family_id     text references families(id) on delete cascade,
  todo_type     text,
  title         text not null,
  due_date      timestamptz,
  repeat        text,
  alert         text,
  completed     boolean default false,
  completed_at  timestamptz,
  created_by    text not null,              -- persona id
  created_at    timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- ── People, families, groups, personas: any authenticated user can read
alter table people         enable row level security;
alter table families       enable row level security;
alter table family_members enable row level security;
alter table groups         enable row level security;
alter table group_members  enable row level security;
alter table personas       enable row level security;
alter table persona_people enable row level security;
alter table person_shepherds enable row level security;

create policy "authenticated_read_people"          on people          for select using (auth.uid() is not null);
create policy "authenticated_read_families"        on families        for select using (auth.uid() is not null);
create policy "authenticated_read_family_members"  on family_members  for select using (auth.uid() is not null);
create policy "authenticated_read_groups"          on groups          for select using (auth.uid() is not null);
create policy "authenticated_read_group_members"   on group_members   for select using (auth.uid() is not null);
create policy "authenticated_read_personas"        on personas        for select using (auth.uid() is not null);
create policy "authenticated_read_persona_people"  on persona_people  for select using (auth.uid() is not null);
create policy "authenticated_read_person_shepherds" on person_shepherds for select using (auth.uid() is not null);

-- Mutations on directory data use service_role (seed script / admin functions).
-- Authenticated users can update their own person record (profile edits).
create policy "update_own_person" on people for update using (
  id = (select person_id from personas where user_id = auth.uid() limit 1)
);
-- Authenticated users can insert/update people (shepherds editing congregation data)
create policy "authenticated_insert_people" on people for insert with check (auth.uid() is not null);
create policy "authenticated_update_people" on people for update using (auth.uid() is not null);

create policy "authenticated_write_families"       on families        for all using (auth.uid() is not null);
create policy "authenticated_write_family_members" on family_members  for all using (auth.uid() is not null);
create policy "authenticated_write_groups"         on groups          for all using (auth.uid() is not null);
create policy "authenticated_write_group_members"  on group_members   for all using (auth.uid() is not null);
create policy "authenticated_write_persona_people" on persona_people  for all using (auth.uid() is not null);
create policy "authenticated_write_person_shepherds" on person_shepherds for all using (auth.uid() is not null);

-- Personas: any authenticated user can insert their own (new sign-up flow)
create policy "authenticated_insert_personas" on personas for insert with check (
  auth.uid() is not null and user_id = auth.uid()
);
create policy "authenticated_update_own_persona" on personas for update using (
  user_id = auth.uid()
);

-- ── Notes RLS ─────────────────────────────────────────────────
alter table notes enable row level security;

create policy "notes_select" on notes for select using (
  auth.uid() is not null and (
    -- admin sees everything
    exists (
      select 1 from personas
      where user_id = auth.uid() and role = 'admin'
    )
    or
    -- own notes (any visibility)
    created_by = (
      select id from personas where user_id = auth.uid() limit 1
    )
    or
    -- public notes for people in my flock
    (
      visibility = 'public'
      and person_id in (
        select pp.person_id
        from persona_people pp
        join personas p on p.id = pp.persona_id
        where p.user_id = auth.uid()
      )
    )
    or
    -- public family notes where I shepherd at least one member
    (
      visibility = 'public'
      and family_id in (
        select f.id
        from families f
        join family_members fm on fm.family_id = f.id
        join persona_people pp on pp.person_id = fm.person_id
        join personas p on p.id = pp.persona_id
        where p.user_id = auth.uid()
      )
    )
  )
);

create policy "notes_insert" on notes for insert with check (
  auth.uid() is not null and
  created_by = (select id from personas where user_id = auth.uid() limit 1)
);

create policy "notes_update" on notes for update using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
);

create policy "notes_delete" on notes for delete using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);

-- ── Todos RLS ─────────────────────────────────────────────────
alter table todos enable row level security;

create policy "todos_select" on todos for select using (
  auth.uid() is not null and (
    exists (
      select 1 from personas
      where user_id = auth.uid() and role = 'admin'
    )
    or
    created_by = (
      select id from personas where user_id = auth.uid() limit 1
    )
    or
    person_id in (
      select pp.person_id
      from persona_people pp
      join personas p on p.id = pp.persona_id
      where p.user_id = auth.uid()
    )
  )
);

create policy "todos_insert" on todos for insert with check (
  auth.uid() is not null and
  created_by = (select id from personas where user_id = auth.uid() limit 1)
);

create policy "todos_update" on todos for update using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);

create policy "todos_delete" on todos for delete using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);
