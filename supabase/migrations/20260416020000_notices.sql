-- ── Notices ──────────────────────────────────────────────────
-- Short, shared-awareness notes visible to all shepherds.

create table if not exists notices (
  id          text primary key,
  person_id   text references people(id) on delete cascade,
  family_id   text references families(id) on delete cascade,
  category    text not null,   -- 'physical-need' | 'spiritual-need' | 'other'
  urgency     text not null,   -- 'urgent' | 'moderate' | 'ongoing'
  content     text not null,
  created_by  text not null,
  created_at  timestamptz default now()
);
