-- ============================================================
-- Seed hidden test family, test people, and approved_emails rows
-- for the three role-test accounts. Auth users (auth.users) and
-- their passwords must still be created manually in the Supabase
-- dashboard with Auto Confirm enabled; see .claude/docs/test-accounts.md.
--
-- After each test user signs in for the first time, run the SQL
-- snippet at the bottom of this file (commented) to stamp the
-- persona with the correct role + is_test = true.
-- ============================================================

-- Test family
insert into families (id, label, tags, is_test)
values ('test-family', 'Test Family', array['test'], true)
on conflict (id) do update set is_test = true;

-- Test people
insert into people (
  id, preferred_name, last_name, membership_status, language,
  family_id, is_test, created_at
)
values
  ('test-person-admin',    'Test', 'Admin',    'member', 'English', 'test-family', true, now()),
  ('test-person-shepherd', 'Test', 'Shepherd', 'member', 'English', 'test-family', true, now()),
  ('test-person-welcome',  'Test', 'Welcome',  'member', 'English', 'test-family', true, now())
on conflict (id) do update set is_test = true;

insert into family_members (family_id, person_id)
values
  ('test-family', 'test-person-admin'),
  ('test-family', 'test-person-shepherd'),
  ('test-family', 'test-person-welcome')
on conflict do nothing;

-- Approved emails — non-routable domain so they can never collide with real Gmail
insert into approved_emails (email, label, person_id)
values
  ('test-admin@oicshepherd.test',    'Test Admin',    'test-person-admin'),
  ('test-shepherd@oicshepherd.test', 'Test Shepherd', 'test-person-shepherd'),
  ('test-welcome@oicshepherd.test',  'Test Welcome',  'test-person-welcome')
on conflict (email) do update set person_id = excluded.person_id, label = excluded.label;

-- ─────────────────────────────────────────────────────────────
-- After the three test users have been created in Supabase Auth
-- (Auth → Users → Add user, Auto Confirm) and have signed in once,
-- run this snippet manually to set roles + the is_test flag on
-- their auto-created personas:
--
-- update personas set role = 'admin',         is_test = true
--   where person_id = 'test-person-admin';
-- update personas set role = 'shepherd',      is_test = true
--   where person_id = 'test-person-shepherd';
-- update personas set role = 'welcome-team',  is_test = true
--   where person_id = 'test-person-welcome';
-- ─────────────────────────────────────────────────────────────
