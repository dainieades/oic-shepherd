-- Visitor intake submissions: immutable record of a visitor-card form fill.
-- Welcome Team typing into the app inserts with source='app', status='promoted',
-- and the resulting person_id in the same flow. The QR/public path lands as
-- source='qr', status='pending' (RLS policy for that ships with the public route).

alter table "public"."people"
  add column if not exists is_student boolean default false;

create table if not exists "public"."visitor_submissions" (
  id uuid default gen_random_uuid() primary key,
  submitted_at timestamptz default now() not null,
  submitted_by text,
  source text not null check (source in ('app', 'qr')),
  status text not null check (status in ('pending', 'promoted', 'discarded')),
  person_id text references people(id) on delete set null,
  preferred_name text not null,
  last_name text,
  phone text,
  email text,
  is_student boolean default false not null,
  languages text[] default '{}' not null,
  referral_source text check (referral_source in ('flyer', 'online', 'drive-by', 'school', 'friend', 'other')),
  referral_detail text,
  interests text[] default '{}' not null,
  prayer_request text
);

create index if not exists visitor_submissions_status_idx
  on visitor_submissions (status, submitted_at desc);

create index if not exists visitor_submissions_person_id_idx
  on visitor_submissions (person_id);

alter table "public"."visitor_submissions" enable row level security;

create policy "Authenticated users can read visitor submissions"
  on visitor_submissions for select
  using (
    exists (
      select 1 from personas
      where personas.user_id = auth.uid()
        and personas.role in ('admin', 'shepherd', 'welcome-team')
    )
  );

create policy "Welcome team and above can insert visitor submissions"
  on visitor_submissions for insert
  with check (
    exists (
      select 1 from personas
      where personas.user_id = auth.uid()
        and personas.role in ('admin', 'shepherd', 'welcome-team')
    )
  );

create policy "Admins can update visitor submissions"
  on visitor_submissions for update
  using (
    exists (
      select 1 from personas
      where personas.user_id = auth.uid()
        and personas.role = 'admin'
    )
  );
