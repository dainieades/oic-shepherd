SET session_replication_role = replica;

--
-- Mock seed for local development.
-- All names, emails, phone numbers, and personal details are entirely fictional.
-- Covers every enum value in the codebase:
--   church_attendance: visitor, regular, on-leave, fellowship-group-only, archived
--   membership_status: member, non-member, membership-track
--   gender: male, female, (null)
--   marital_status: single, married, widowed, divorced, (null)
--   app_role: admin, shepherd, no-access
--   life_stage: Student, Young Professional, Family, Senior
--   NoteType: check-in, prayer-request, event, general
--   ContactMethod: call, text, in-person, wechat
--   NoteVisibility: private, public
--   TodoType fields: check-in, task, meeting, message, birthday, anniversary
--   TodoRepeat: none, daily, weekly, biweekly, monthly, yearly
--   NoticeUrgency: urgent, moderate, ongoing
--   NoticePrivacy: pastor-only, pastor-and-shepherds, everyone
--   NoticeCategory: physical-need, spiritual-need, social-need, psychological-need, other
--   visitor_submissions status: pending, promoted
--   visitor_submissions source: qr, app
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================
-- PEOPLE
-- ============================================================

INSERT INTO "public"."people" ("id", "photo", "gender", "marital_status", "birthday", "baptism_date", "membership_date", "anniversary", "phone", "home_phone", "email", "home_address", "is_shepherd", "church_positions", "membership_status", "family_id", "last_contact_date", "created_at", "is_being_discipled", "app_role", "created_by", "church_attendance", "language", "last_edited_at", "last_edited_by_name", "original_photo", "preferred_name", "last_name", "alternative_name", "is_student", "is_test") VALUES
	-- Persona-linked people (app users)
	('samuel-chen', NULL, 'male', 'married', '1975-08-12', '1998-06-15', '2005-03-01', '2002-11-20', '(555) 201-0001', NULL, 'samuel.chen@mock.test', '42 Shepherd Lane, Mockville, MK 10001', true, '{"Pastor","Elder"}', 'member', NULL, '2026-05-10 00:00:00+00', '2025-01-01 00:00:00+00', false, 'admin', NULL, 'regular', '["English","Mandarin Chinese"]', NULL, NULL, NULL, 'Samuel', 'Chen', NULL, false, false),
	('grace-park', NULL, 'female', 'married', '1985-03-22', '2003-09-14', '2010-06-01', '2012-07-04', '(555) 201-0002', NULL, 'grace.park@mock.test', '7 Cornerstone Ave, Mockville, MK 10002', true, '{"Word"}', 'member', NULL, '2026-05-12 00:00:00+00', '2025-01-01 00:00:00+00', false, 'shepherd', NULL, 'regular', '["English"]', NULL, NULL, NULL, 'Grace', 'Park', NULL, false, false),
	('michael-torres', NULL, 'male', 'single', '1990-11-05', '2010-05-20', '2015-09-01', NULL, '(555) 201-0003', NULL, 'michael.torres@mock.test', '15 Vine Street, Mockville, MK 10003', true, '{"Youth","Mission"}', 'member', NULL, '2026-05-14 00:00:00+00', '2025-01-01 00:00:00+00', false, 'shepherd', NULL, 'regular', '["English","Spanish"]', NULL, NULL, NULL, 'Michael', 'Torres', NULL, false, false),
	('emma-davis', NULL, 'female', 'single', '1993-06-17', '2012-08-11', '2018-01-15', NULL, '(555) 201-0004', NULL, 'emma.davis@mock.test', '33 Grace Road, Mockville, MK 10004', false, '{"Welcome Team","Coffee"}', 'member', NULL, '2026-05-11 00:00:00+00', '2025-01-01 00:00:00+00', false, 'shepherd', NULL, 'regular', '["English"]', NULL, NULL, NULL, 'Emma', 'Davis', NULL, false, false),
	-- Regular members — married with families
	('david-kim', NULL, 'male', 'married', '1984-04-30', '2006-10-02', '2014-04-01', '2012-09-15', '(555) 301-0101', '(555) 301-0100', 'david.kim@mock.test', '8 Maple Street, Mockville, MK 10010', false, '{"Finance","IT Team"}', 'member', 'kim-household', '2026-05-08 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-admin', 'regular', '["English","Korean"]', NULL, NULL, NULL, 'David', 'Kim', NULL, false, false),
	('sarah-kim', NULL, 'female', 'married', '1986-09-14', '2007-04-22', '2014-04-01', '2012-09-15', '(555) 301-0102', NULL, 'sarah.kim@mock.test', '8 Maple Street, Mockville, MK 10010', false, '{"Nursery","Children"}', 'member', 'kim-household', '2026-05-08 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-admin', 'regular', '["English","Korean"]', NULL, NULL, NULL, 'Sarah', 'Kim', NULL, false, false),
	('robert-hall', NULL, 'male', 'married', '1968-10-11', '1990-04-18', '1996-09-01', '1995-06-22', '(555) 301-0701', '(555) 301-0700', 'robert.hall@mock.test', '100 Oak Terrace, Mockville, MK 10070', false, '{"Elder","Deacon"}', 'member', 'hall-household', '2026-05-10 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-admin', 'regular', '["English"]', NULL, NULL, NULL, 'Robert', 'Hall', NULL, false, false),
	('linda-hall', NULL, 'female', 'married', '1970-12-03', '1992-07-14', '1997-03-01', '1995-06-22', '(555) 301-0702', NULL, 'linda.hall@mock.test', '100 Oak Terrace, Mockville, MK 10070', false, '{"Worship Team","Children"}', 'member', 'hall-household', '2026-05-10 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-admin', 'regular', '["English"]', NULL, NULL, NULL, 'Linda', 'Hall', NULL, false, false),
	('peter-yang', NULL, 'male', 'married', '1985-12-21', '2009-11-01', '2013-08-01', '2015-05-18', '(555) 301-0302', NULL, NULL, '22 Blossom Court, Mockville, MK 10030', false, '{"Kitchen"}', 'member', 'yang-household', '2026-05-09 00:00:00+00', '2025-02-01 00:00:00+00', false, 'no-access', 'mock-shepherd-1', 'regular', '["Mandarin Chinese","English"]', NULL, NULL, NULL, 'Peter', 'Yang', '杨大伟', false, false),
	('mei-zhang', NULL, 'female', 'married', '1988-07-03', NULL, NULL, '2015-05-18', '(555) 301-0301', NULL, 'mei.zhang@mock.test', '22 Blossom Court, Mockville, MK 10030', false, '{}', 'non-member', 'yang-household', '2026-05-09 00:00:00+00', '2025-02-01 00:00:00+00', false, 'no-access', 'mock-shepherd-1', 'regular', '["Mandarin Chinese","English"]', NULL, NULL, NULL, 'Mei', 'Zhang', '张美', false, false),
	('kevin-lee', NULL, 'male', 'married', '1989-08-19', '2018-03-25', '2019-05-01', '2018-10-12', '(555) 301-0402', NULL, NULL, '5 Harbor View Drive, Mockville, MK 10040', false, '{"Operation"}', 'member', 'lee-household', '2026-05-07 00:00:00+00', '2025-03-01 00:00:00+00', false, 'no-access', 'mock-shepherd-1', 'regular', '["English"]', NULL, NULL, NULL, 'Kevin', 'Lee', NULL, false, false),
	('jennifer-lee', NULL, 'female', 'married', '1991-03-28', '2020-06-07', NULL, '2018-10-12', '(555) 301-0401', NULL, 'jennifer.lee@mock.test', '5 Harbor View Drive, Mockville, MK 10040', false, '{}', 'membership-track', 'lee-household', '2026-05-07 00:00:00+00', '2025-03-01 00:00:00+00', false, 'no-access', 'mock-shepherd-1', 'regular', '["English"]', NULL, NULL, NULL, 'Jennifer', 'Lee', NULL, false, false),
	-- Regular members — single
	('angela-white', NULL, 'female', 'single', '1995-01-09', '2015-09-20', '2020-02-01', NULL, '(555) 301-0501', NULL, 'angela.white@mock.test', NULL, false, '{"Welcome Team","Admin"}', 'member', NULL, '2026-05-13 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-shepherd-1', 'regular', '["English"]', NULL, NULL, NULL, 'Angela', 'White', NULL, false, false),
	('jessica-chen', NULL, 'female', 'single', '2000-05-25', '2019-08-03', '2022-11-01', NULL, '(555) 301-0601', NULL, 'jessica.chen@mock.test', NULL, false, '{"Worship Team","Livestream"}', 'member', NULL, '2026-05-11 00:00:00+00', '2025-04-01 00:00:00+00', false, 'no-access', 'mock-shepherd-1', 'regular', '["English","Cantonese"]', NULL, NULL, NULL, 'Jessica', 'Chen', '陈佳佳', true, false),
	('james-wilson', NULL, 'male', 'single', '2001-02-14', NULL, NULL, NULL, '(555) 301-0201', NULL, 'james.wilson@mock.test', NULL, false, '{}', 'membership-track', NULL, '2026-05-06 00:00:00+00', '2025-06-01 00:00:00+00', true, 'no-access', 'mock-shepherd-1', 'regular', '["English"]', NULL, NULL, NULL, 'James', 'Wilson', NULL, true, false),
	('chris-anderson', NULL, 'male', 'single', '1997-06-30', '2021-03-28', '2023-07-01', NULL, '(555) 301-0801', NULL, NULL, NULL, false, '{}', 'member', NULL, '2026-05-09 00:00:00+00', '2025-05-01 00:00:00+00', true, 'no-access', 'mock-shepherd-2', 'regular', '["English"]', NULL, NULL, NULL, 'Chris', 'Anderson', NULL, false, false),
	('olivia-taylor', NULL, 'female', 'single', '2002-09-16', NULL, NULL, NULL, '(555) 301-0901', NULL, 'olivia.taylor@mock.test', NULL, false, '{}', 'member', NULL, '2026-05-07 00:00:00+00', '2025-07-01 00:00:00+00', false, 'no-access', 'mock-shepherd-2', 'regular', '["English"]', NULL, NULL, NULL, 'Olivia', 'Taylor', NULL, true, false),
	('henry-nguyen', NULL, 'male', 'married', '1982-01-27', '2008-12-06', '2016-08-01', '2011-04-30', '(555) 301-1001', NULL, 'henry.nguyen@mock.test', '18 Sunset Blvd, Mockville, MK 10100', false, '{"Safety Team","Operation"}', 'member', NULL, '2026-05-12 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-shepherd-2', 'regular', '["English","Vietnamese"]', NULL, NULL, NULL, 'Henry', 'Nguyen', NULL, false, false),
	('william-zhang', NULL, 'male', 'single', '1996-03-10', '2017-09-03', '2021-01-01', NULL, '(555) 301-1301', NULL, NULL, NULL, false, '{}', 'member', NULL, '2026-04-18 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-shepherd-2', 'fellowship-group-only', '["English","Mandarin Chinese"]', NULL, NULL, NULL, 'William', 'Zhang', NULL, false, false),
	-- On-leave and fellowship-group-only
	('lisa-johnson', NULL, 'female', 'divorced', '1978-04-05', '2000-02-14', '2008-11-01', NULL, '(555) 301-1101', NULL, 'lisa.johnson@mock.test', '29 Pine Close, Mockville, MK 10110', false, '{}', 'member', NULL, '2026-04-15 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-admin', 'on-leave', '["English"]', NULL, NULL, NULL, 'Lisa', 'Johnson', NULL, false, false),
	('thomas-brown', NULL, 'male', 'widowed', '1960-07-19', '1985-11-30', '1992-04-01', NULL, '(555) 301-1201', '(555) 301-1200', NULL, '6 Elmwood Road, Mockville, MK 10120', false, '{"Deacon"}', 'member', NULL, '2026-04-20 00:00:00+00', '2025-01-01 00:00:00+00', false, 'no-access', 'mock-admin', 'fellowship-group-only', '["English"]', NULL, NULL, NULL, 'Thomas', 'Brown', NULL, false, false),
	-- Visitors / non-members
	('priya-patel', NULL, 'female', NULL, NULL, NULL, NULL, NULL, '(555) 401-0101', NULL, 'priya.patel@mock.test', NULL, false, '{}', 'non-member', NULL, NULL, '2026-04-28 00:00:00+00', false, 'no-access', 'mock-shepherd-2', 'visitor', '["English"]', NULL, NULL, NULL, 'Priya', 'Patel', NULL, false, false),
	('ryan-murphy', NULL, 'male', 'single', NULL, NULL, NULL, NULL, '(555) 401-0201', NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2026-05-02 00:00:00+00', false, 'no-access', 'mock-shepherd-2', 'visitor', '["English"]', NULL, NULL, NULL, 'Ryan', 'Murphy', NULL, false, false),
	('sophie-martin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2026-05-15 14:00:00+00', false, 'no-access', 'e279a7a8-ca7a-43ee-a083-c7bbd383c37e', 'visitor', '["English"]', NULL, NULL, NULL, 'Sophie', 'Martin', NULL, false, false),
	-- Archived
	('noah-garcia', NULL, 'male', 'single', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2025-01-01 00:00:00+00', false, 'no-access', NULL, 'archived', '["English","Spanish"]', NULL, NULL, NULL, 'Noah', 'Garcia', NULL, false, false),
	-- Test-persona-created records (is_test = true)
	('mp74139kmmadg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2026-05-15 16:06:41.096+00', false, 'no-access', 'bd83730a-aead-4824-a21e-bb1368832bb3', 'visitor', '["English"]', NULL, NULL, NULL, 'Test Visitor Alpha', NULL, NULL, false, true),
	('mp74tvflqygp2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2026-05-15 16:29:03.969+00', false, 'no-access', 'e279a7a8-ca7a-43ee-a083-c7bbd383c37e', 'visitor', '["English"]', NULL, NULL, NULL, 'Test Visitor Beta', 'QR Arrival', NULL, false, true),
	('mp7577xgo8nwe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2026-05-15 16:39:26.692+00', false, 'no-access', 'e279a7a8-ca7a-43ee-a083-c7bbd383c37e', 'visitor', '["English"]', NULL, NULL, NULL, 'Test Visitor Gamma', 'QR Entry', NULL, false, true),
	('mp736a95ow86h', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2026-05-15 15:42:44.57+00', false, 'no-access', '72caf16e-bbbf-4154-8bc2-3800a4ea1e01', 'visitor', '["English"]', NULL, NULL, NULL, 'Test Person One', NULL, NULL, false, true),
	('mp73qf7y6i6d6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, '{}', 'non-member', NULL, NULL, '2026-05-15 15:58:23.718+00', false, 'no-access', 'bd83730a-aead-4824-a21e-bb1368832bb3', 'visitor', '["English"]', NULL, NULL, NULL, 'Test Person Two', NULL, NULL, false, true);


-- can_triage_visitors column added by migration; set for welcome-team persona person
UPDATE "public"."people" SET "can_triage_visitors" = true WHERE "id" = 'emma-davis';


-- ============================================================
-- APPROVED EMAILS
-- ============================================================

INSERT INTO "public"."approved_emails" ("email", "label", "created_at", "person_id") VALUES
	('samuel.chen@mock.test', 'Samuel Chen', '2025-01-01 00:00:00+00', 'samuel-chen'),
	('grace.park@mock.test', 'Grace Park', '2025-01-01 00:00:00+00', 'grace-park'),
	('michael.torres@mock.test', 'Michael Torres', '2025-01-01 00:00:00+00', 'michael-torres'),
	('emma.davis@mock.test', 'Emma Davis', '2025-01-01 00:00:00+00', 'emma-davis'),
	('test-welcome@oicshepherd.test', 'Test Welcome', '2026-05-13 20:33:04.101277+00', NULL),
	('test-shepherd@oicshepherd.test', 'Test Shepherd', '2026-05-13 20:33:04.101277+00', NULL),
	('test-admin@oicshepherd.test', 'Test Admin', '2026-05-13 20:33:04.101277+00', NULL);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

INSERT INTO "public"."audit_logs" ("id", "person_id", "changed_by_persona_id", "changed_by_name", "field_name", "old_value", "new_value", "created_at") VALUES
	('aaaa0001-0000-0000-0000-000000000001', 'grace-park', 'mock-admin', 'Pastor Samuel Chen', 'appRole', 'no-access', 'shepherd', '2026-01-10 09:00:00+00'),
	('aaaa0002-0000-0000-0000-000000000002', 'michael-torres', 'mock-admin', 'Pastor Samuel Chen', 'appRole', 'no-access', 'shepherd', '2026-01-10 09:05:00+00'),
	('aaaa0003-0000-0000-0000-000000000003', 'emma-davis', 'mock-admin', 'Pastor Samuel Chen', 'appRole', 'no-access', 'shepherd', '2026-01-10 09:10:00+00'),
	('aaaa0004-0000-0000-0000-000000000004', 'jennifer-lee', 'mock-shepherd-1', 'Grace Park', 'membershipStatus', 'non-member', 'membership-track', '2026-03-15 14:00:00+00'),
	('aaaa0005-0000-0000-0000-000000000005', 'chris-anderson', 'mock-shepherd-2', 'Michael Torres', 'isBeingDiscipled', 'false', 'true', '2026-04-01 10:30:00+00'),
	('aaaa0006-0000-0000-0000-000000000006', 'james-wilson', 'mock-shepherd-1', 'Grace Park', 'membershipStatus', 'non-member', 'membership-track', '2026-02-20 11:00:00+00');


-- ============================================================
-- FAMILIES
-- ============================================================

INSERT INTO "public"."families" ("id", "label", "photo", "tags", "child_count", "primary_contact_id", "created_at", "created_by", "original_photo", "is_test") VALUES
	('kim-household', 'Kim Family', NULL, '{"Young Family"}', 2, 'david-kim', '2025-01-01 00:00:00+00', NULL, NULL, false),
	('yang-household', 'Yang Family', NULL, '{"Mandarin Fellowship"}', 1, 'peter-yang', '2025-01-01 00:00:00+00', NULL, NULL, false),
	('lee-household', 'Lee Family', NULL, '{"Young Family"}', 0, 'kevin-lee', '2025-01-01 00:00:00+00', NULL, NULL, false),
	('hall-household', 'Hall Family', NULL, '{"Senior"}', 3, 'robert-hall', '2025-01-01 00:00:00+00', NULL, NULL, false);


-- ============================================================
-- FAMILY MEMBERS
-- ============================================================

INSERT INTO "public"."family_members" ("family_id", "person_id") VALUES
	('kim-household', 'david-kim'),
	('kim-household', 'sarah-kim'),
	('yang-household', 'peter-yang'),
	('yang-household', 'mei-zhang'),
	('lee-household', 'kevin-lee'),
	('lee-household', 'jennifer-lee'),
	('hall-household', 'robert-hall'),
	('hall-household', 'linda-hall');


-- ============================================================
-- GROUPS
-- ============================================================

INSERT INTO "public"."groups" ("id", "name", "description", "leader_ids", "related_family_ids", "is_test") VALUES
	('young-adults-group', 'Young Adults', 'Fellowship for college students and young professionals in their 20s and 30s.', '{"michael-torres","grace-park"}', '{}', false),
	('young-families-group', 'Young Families', 'Community for families with young children.', '{"samuel-chen","grace-park"}', '{"kim-household","lee-household","yang-household"}', false),
	('senior-fellowship-group', 'Senior Fellowship', 'Gathering for mature believers — prayer, study, and friendship.', '{"robert-hall"}', '{"hall-household"}', false),
	('mandarin-fellowship-group', 'Mandarin Fellowship', 'Cantonese and Mandarin-speaking small group for fellowship and Bible study.', '{"peter-yang"}', '{"yang-household"}', false);


-- ============================================================
-- GROUP MEMBERS
-- ============================================================

INSERT INTO "public"."group_members" ("group_id", "person_id") VALUES
	-- Young Adults
	('young-adults-group', 'michael-torres'),
	('young-adults-group', 'grace-park'),
	('young-adults-group', 'james-wilson'),
	('young-adults-group', 'jessica-chen'),
	('young-adults-group', 'chris-anderson'),
	('young-adults-group', 'olivia-taylor'),
	('young-adults-group', 'ryan-murphy'),
	('young-adults-group', 'priya-patel'),
	-- Young Families
	('young-families-group', 'samuel-chen'),
	('young-families-group', 'grace-park'),
	('young-families-group', 'david-kim'),
	('young-families-group', 'sarah-kim'),
	('young-families-group', 'jennifer-lee'),
	('young-families-group', 'kevin-lee'),
	('young-families-group', 'henry-nguyen'),
	('young-families-group', 'angela-white'),
	-- Senior Fellowship
	('senior-fellowship-group', 'robert-hall'),
	('senior-fellowship-group', 'linda-hall'),
	('senior-fellowship-group', 'thomas-brown'),
	('senior-fellowship-group', 'lisa-johnson'),
	-- Mandarin Fellowship
	('mandarin-fellowship-group', 'peter-yang'),
	('mandarin-fellowship-group', 'mei-zhang'),
	('mandarin-fellowship-group', 'william-zhang'),
	('mandarin-fellowship-group', 'jessica-chen');


-- ============================================================
-- TODOS
-- Covers: all todo types in title/context, all repeat values,
--         completed + incomplete, person-linked + family-linked.
-- ============================================================

INSERT INTO "public"."todos" ("id", "person_id", "family_id", "todo_type", "title", "due_date", "repeat", "alert", "completed", "completed_at", "created_by", "created_at", "end_date", "reminder_due_at", "reminder_sent_at", "reminder") VALUES
	-- check-in type
	('todo-001', 'james-wilson', NULL, NULL, 'Check in with James about membership class progress', '2026-06-10 13:00:00+00', 'monthly', 'none', false, NULL, 'mock-shepherd-1', '2026-05-01 09:00:00+00', NULL, NULL, NULL, NULL),
	('todo-002', 'priya-patel', NULL, NULL, 'Follow up with Priya — is she planning to return Sunday?', '2026-06-05 13:00:00+00', 'none', 'none', false, NULL, 'mock-shepherd-2', '2026-05-10 10:00:00+00', NULL, NULL, NULL, NULL),
	('todo-003', 'chris-anderson', NULL, NULL, 'Monthly discipleship meeting with Chris', '2026-06-12 19:00:00+00', 'monthly', 'none', false, NULL, 'mock-shepherd-2', '2026-05-12 08:00:00+00', NULL, NULL, NULL, NULL),
	-- task type
	('todo-004', 'jennifer-lee', NULL, NULL, 'Send Jennifer the membership class schedule', '2026-05-25 09:00:00+00', 'none', 'none', false, NULL, 'mock-shepherd-1', '2026-05-14 11:00:00+00', NULL, NULL, NULL, NULL),
	('todo-005', NULL, 'kim-household', NULL, 'Deliver meal to Kim family (Sarah recovering from surgery)', '2026-05-22 18:00:00+00', 'none', 'none', true, '2026-05-22 19:15:00+00', 'mock-shepherd-1', '2026-05-18 08:30:00+00', NULL, NULL, NULL, NULL),
	-- meeting type
	('todo-006', 'robert-hall', NULL, NULL, 'Coffee with Robert to discuss elder meeting agenda', '2026-06-03 10:00:00+00', 'none', 'none', false, NULL, 'mock-admin', '2026-05-15 14:00:00+00', NULL, NULL, NULL, NULL),
	('todo-007', 'grace-park', NULL, NULL, 'Bi-weekly shepherd check-in with Grace', '2026-06-01 10:00:00+00', 'biweekly', 'none', false, NULL, 'mock-admin', '2026-05-05 09:00:00+00', NULL, NULL, NULL, NULL),
	-- message type
	('todo-008', 'lisa-johnson', NULL, NULL, 'Send Lisa a message to check how she is doing', '2026-05-28 09:00:00+00', 'none', 'none', false, NULL, 'mock-admin', '2026-05-13 10:00:00+00', NULL, NULL, NULL, NULL),
	('todo-009', 'william-zhang', NULL, NULL, 'Text William — has he been able to join Mandarin group?', '2026-05-29 09:00:00+00', 'weekly', 'none', false, NULL, 'mock-shepherd-2', '2026-05-08 11:00:00+00', NULL, NULL, NULL, NULL),
	-- birthday type (yearly repeat)
	('todo-010', 'david-kim', NULL, NULL, 'David''s birthday', '2026-04-30 08:00:00+00', 'yearly', 'none', true, '2026-04-30 10:00:00+00', 'mock-shepherd-1', '2025-04-30 00:00:00+00', NULL, NULL, NULL, NULL),
	('todo-011', 'angela-white', NULL, NULL, 'Angela''s birthday', '2026-01-09 08:00:00+00', 'yearly', 'none', true, '2026-01-09 09:30:00+00', 'mock-shepherd-1', '2025-01-09 00:00:00+00', NULL, NULL, NULL, NULL),
	-- anniversary type (yearly repeat)
	('todo-012', NULL, 'kim-household', NULL, 'Kim family anniversary', '2026-09-15 08:00:00+00', 'yearly', 'none', false, NULL, 'mock-shepherd-1', '2025-09-15 00:00:00+00', NULL, NULL, NULL, NULL),
	-- daily and weekly repeats
	('todo-013', 'olivia-taylor', NULL, NULL, 'Check Olivia is still in the weekly prayer chain', '2026-05-20 08:00:00+00', 'weekly', 'none', false, NULL, 'mock-shepherd-2', '2026-05-01 08:00:00+00', NULL, NULL, NULL, NULL),
	-- completed todo with note link
	('todo-014', 'mei-zhang', NULL, NULL, 'Connect Mei with Mandarin Fellowship leader', '2026-05-10 13:00:00+00', 'none', 'none', true, '2026-05-10 15:30:00+00', 'mock-shepherd-1', '2026-04-28 09:00:00+00', NULL, NULL, NULL, NULL),
	-- family-linked todo
	('todo-015', NULL, 'hall-household', NULL, 'Visit Hall family — Robert mentioned Linda has been unwell', '2026-06-08 14:00:00+00', 'none', 'none', false, NULL, 'mock-admin', '2026-05-16 09:00:00+00', NULL, NULL, NULL, NULL),
	-- test-persona-created
	('mp736au23r05w', 'mp736a95ow86h', NULL, NULL, 'Contact new test person', '2026-05-22 15:42:44.57+00', NULL, NULL, false, NULL, '72caf16e-bbbf-4154-8bc2-3800a4ea1e01', '2026-05-15 15:42:44.57+00', NULL, NULL, NULL, NULL),
	('mp73qfhioivcq', 'mp73qf7y6i6d6', NULL, NULL, 'Contact test person two', '2026-05-22 15:58:23.718+00', NULL, NULL, false, NULL, 'bd83730a-aead-4824-a21e-bb1368832bb3', '2026-05-15 15:58:23.718+00', NULL, NULL, NULL, NULL),
	('mp74tvorzx4j8', 'mp74tvflqygp2', NULL, NULL, 'Contact test QR arrival', '2026-05-22 16:29:04.298+00', NULL, NULL, false, NULL, 'e279a7a8-ca7a-43ee-a083-c7bbd383c37e', '2026-05-15 16:29:04.299+00', NULL, NULL, NULL, NULL);


-- ============================================================
-- NOTES
-- Covers: all NoteType values, all ContactMethod values,
--         both visibility values, person-linked + family-linked,
--         notes with and without content.
-- ============================================================

INSERT INTO "public"."notes" ("id", "person_id", "family_id", "type", "visibility", "contact_method", "content", "mentions", "created_by", "created_at", "todo_id") VALUES
	-- check-in notes
	('note-001', 'james-wilson', NULL, 'check-in', 'private', 'in-person', 'Caught up with James after the Sunday service. He is settling into the membership track well and asked several thoughtful questions. Encouraged him to keep engaging.', '{}', 'mock-shepherd-1', '2026-05-01 14:00:00+00', NULL),
	('note-002', 'mei-zhang', NULL, 'check-in', 'private', 'wechat', 'Brief check-in with Mei over WeChat. She says she misses family back home but is grateful for the Mandarin group. Encouraged her to keep coming to fellowship.', '{}', 'mock-shepherd-1', '2026-04-20 10:30:00+00', NULL),
	('note-003', 'ryan-murphy', NULL, 'check-in', 'private', 'text', 'Texted Ryan after he missed two Sundays. He replied that he had been out of town for work. Seems fine — will follow up if he misses again.', '{}', 'mock-shepherd-2', '2026-04-28 09:00:00+00', NULL),
	('note-004', 'lisa-johnson', NULL, 'check-in', 'private', 'call', 'Called Lisa. She has been going through a rough patch since the divorce was finalised and has stepped back from church for a season. She appreciated the call and said she plans to return when she feels ready. Prayed with her.', '{}', 'mock-admin', '2026-04-15 11:00:00+00', NULL),
	('note-005', 'thomas-brown', NULL, 'check-in', 'private', 'in-person', 'Spoke with Thomas at the senior fellowship. He is doing well and mentioned he misses attending Sunday services regularly since his mobility declined. He still attends the small group.', '{}', 'mock-admin', '2026-04-20 16:00:00+00', NULL),
	-- prayer-request notes
	('note-006', 'chris-anderson', NULL, 'prayer-request', 'private', NULL, 'Chris shared he has been struggling spiritually — feeling disconnected from God. He asked for prayer and accountability. We prayed together. Will meet weekly for a while.', '{}', 'mock-shepherd-2', '2026-04-10 19:00:00+00', NULL),
	('note-007', NULL, 'lee-household', 'prayer-request', 'private', NULL, 'Jennifer reached out asking for prayer for her and Kevin — they have been feeling the stress of the new house purchase and want wisdom. Prayed for them.', '{}', 'mock-shepherd-1', '2026-04-25 20:00:00+00', NULL),
	('note-008', 'henry-nguyen', NULL, 'prayer-request', 'private', 'wechat', 'Henry messaged about a health scare with his mother overseas. He asked for prayer and seems anxious. Will check in again next week.', '{"samuel-chen"}', 'mock-shepherd-2', '2026-05-06 08:30:00+00', NULL),
	-- event notes
	('note-009', 'priya-patel', NULL, 'event', 'public', 'in-person', 'Met Priya for the first time at the church picnic. She came with a coworker. Very warm and curious about the church. Introduced her to a few people her age.', '{}', 'mock-shepherd-2', '2026-04-27 15:00:00+00', NULL),
	('note-010', NULL, 'yang-household', 'event', 'public', 'in-person', 'The Yang family hosted a Mandarin group dinner at their home. Great time of fellowship. Mei and Peter are generous hosts and the group is growing closer.', '{"william-zhang","jessica-chen"}', 'mock-shepherd-1', '2026-04-15 21:00:00+00', NULL),
	('note-011', 'jessica-chen', NULL, 'event', 'public', NULL, 'Jessica led worship at the youth night for the first time — she did beautifully. Several younger members commented on how much it blessed them.', '{}', 'mock-shepherd-1', '2026-05-02 22:00:00+00', NULL),
	-- general notes
	('note-012', 'angela-white', NULL, 'general', 'private', 'in-person', 'Angela mentioned she would love more responsibility on the welcome team. She is reliable and warm — worth considering her for a co-lead role.', '{}', 'mock-shepherd-1', '2026-05-08 12:00:00+00', NULL),
	('note-013', 'olivia-taylor', NULL, 'general', 'private', 'text', 'Olivia texted to say she enjoyed the young adults retreat. She is making friends and seems more at home in the church.', '{}', 'mock-shepherd-2', '2026-04-30 18:00:00+00', NULL),
	('note-014', 'william-zhang', NULL, 'general', 'private', 'wechat', 'William has been coming less often. He mentioned feeling in between — not quite at home in English services, not always available for Mandarin group. Encouraged him to try the Mandarin group more consistently.', '{}', 'mock-shepherd-2', '2026-04-18 09:00:00+00', NULL),
	('note-015', NULL, 'hall-household', 'general', 'private', 'call', 'Called Robert to check in on the household. He mentioned Linda has had some fatigue lately. Offered to arrange a pastoral visit.', '{}', 'mock-admin', '2026-05-14 10:00:00+00', 'todo-015'),
	-- note linked to completed todo
	('note-016', 'mei-zhang', NULL, 'check-in', 'public', 'in-person', 'Introduced Mei to Peter Yang (group leader) after the service. She was delighted. Will be attending the Mandarin group next week.', '{"peter-yang"}', 'mock-shepherd-1', '2026-05-10 16:00:00+00', 'todo-014');


-- ============================================================
-- NOTICES
-- Covers: all urgency values, all privacy values,
--         all category values (incl. multi-category),
--         person-linked + family-linked notices.
-- ============================================================

INSERT INTO "public"."notices" ("id", "person_id", "family_id", "urgency", "content", "created_by", "created_at", "privacy", "categories") VALUES
	-- urgent
	('notice-001', 'lisa-johnson', NULL, 'urgent', 'Lisa is in a fragile place emotionally following the finalisation of her divorce. Needs consistent, gentle pastoral follow-up this month. Do not publicly discuss her situation.', 'mock-admin', '2026-04-15 11:30:00+00', 'pastor-only', '{psychological-need}'),
	('notice-002', 'henry-nguyen', NULL, 'urgent', 'Henry''s mother has been hospitalised overseas. He is managing anxiety and may need practical support if he travels. Please pray and check in.', 'mock-shepherd-2', '2026-05-06 09:00:00+00', 'pastor-and-shepherds', '{physical-need,psychological-need}'),
	('notice-003', NULL, 'kim-household', 'urgent', 'Sarah Kim had minor surgery this week. The family could use meal support for the next two weeks. Coordinated through Emma (welcome team).', 'mock-shepherd-1', '2026-05-18 08:00:00+00', 'pastor-and-shepherds', '{physical-need,social-need}'),
	-- moderate
	('notice-004', 'chris-anderson', NULL, 'moderate', 'Chris has expressed spiritual dryness and has been missing services intermittently. Michael is meeting with him weekly for discipleship — prayer appreciated.', 'mock-shepherd-2', '2026-04-11 10:00:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('notice-005', 'james-wilson', NULL, 'moderate', 'James has been asking deep questions about faith and membership — he is genuinely seeking. Would benefit from a one-on-one conversation with Pastor Samuel.', 'mock-shepherd-1', '2026-05-06 14:00:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('notice-006', 'priya-patel', NULL, 'moderate', 'Priya has visited twice and seems very open. She mentioned she has no church background. Good opportunity for intentional welcome and follow-up.', 'mock-shepherd-2', '2026-04-28 16:00:00+00', 'everyone', '{social-need}'),
	-- ongoing
	('notice-007', 'thomas-brown', NULL, 'ongoing', 'Thomas has limited mobility and cannot always attend Sunday services. He values the senior fellowship group and home visits. Please remember him.', 'mock-admin', '2026-03-01 10:00:00+00', 'everyone', '{physical-need}'),
	('notice-008', 'william-zhang', NULL, 'ongoing', 'William has been drifting between the English and Mandarin congregations and feels unsettled. Ongoing pastoral care needed to help him find community.', 'mock-shepherd-2', '2026-04-18 10:00:00+00', 'pastor-and-shepherds', '{social-need,spiritual-need}'),
	('notice-009', NULL, 'yang-household', 'ongoing', 'Mei (non-member) and Peter are in different places spiritually. Peter is a committed believer; Mei is exploring faith. Handle conversations with sensitivity.', 'mock-shepherd-1', '2026-03-15 09:00:00+00', 'pastor-and-shepherds', '{spiritual-need,other}');


-- ============================================================
-- PERSON SHEPHERDS
-- ============================================================

INSERT INTO "public"."person_shepherds" ("person_id", "shepherd_id") VALUES
	-- shepherd-1 (grace-park) flock
	('james-wilson', 'mock-shepherd-1'),
	('mei-zhang', 'mock-shepherd-1'),
	('peter-yang', 'mock-shepherd-1'),
	('jennifer-lee', 'mock-shepherd-1'),
	('kevin-lee', 'mock-shepherd-1'),
	('angela-white', 'mock-shepherd-1'),
	('jessica-chen', 'mock-shepherd-1'),
	-- shepherd-2 (michael-torres) flock
	('chris-anderson', 'mock-shepherd-2'),
	('olivia-taylor', 'mock-shepherd-2'),
	('henry-nguyen', 'mock-shepherd-2'),
	('william-zhang', 'mock-shepherd-2'),
	('priya-patel', 'mock-shepherd-2'),
	('ryan-murphy', 'mock-shepherd-2'),
	-- admin directly shepherds some members
	('david-kim', 'mock-admin'),
	('sarah-kim', 'mock-admin'),
	('robert-hall', 'mock-admin'),
	('linda-hall', 'mock-admin'),
	('lisa-johnson', 'mock-admin'),
	('thomas-brown', 'mock-admin'),
	-- cross-assigned (some under both admin and a shepherd)
	('henry-nguyen', 'mock-admin'),
	('james-wilson', 'mock-admin'),
	-- shepherd personas themselves
	('samuel-chen', 'mock-admin'),
	('grace-park', 'mock-admin'),
	('michael-torres', 'mock-admin');


-- ============================================================
-- PERSONAS
-- ============================================================

INSERT INTO "public"."personas" ("id", "user_id", "name", "role", "person_id", "theme_preference", "map_provider", "email", "calendar_sync_enabled", "calendar_feed_token", "calendar_connected_app", "notify_person_added", "notify_notice_added", "notify_shepherd_assigned", "notify_person_updated", "notify_todo_created", "is_test") VALUES
	-- Non-test personas
	('mock-admin', NULL, 'Pastor Samuel Chen', 'admin', 'samuel-chen', 'system', NULL, 'samuel.chen@mock.test', false, NULL, NULL, true, true, true, true, true, false),
	('mock-shepherd-1', NULL, 'Grace Park', 'shepherd', 'grace-park', 'system', NULL, 'grace.park@mock.test', false, NULL, NULL, true, true, true, true, true, false),
	('mock-shepherd-2', NULL, 'Michael Torres', 'shepherd', 'michael-torres', NULL, NULL, 'michael.torres@mock.test', false, NULL, NULL, true, true, true, true, true, false),
	('mock-welcome', NULL, 'Emma Davis', 'shepherd', 'emma-davis', NULL, NULL, 'emma.davis@mock.test', false, NULL, NULL, true, true, true, true, true, false),
	-- Test personas (user_id stamped by scripts/local-bootstrap.sh after supabase db reset)
	('e279a7a8-ca7a-43ee-a083-c7bbd383c37e', 'e279a7a8-ca7a-43ee-a083-c7bbd383c37e', 'test-welcome', 'shepherd', NULL, NULL, NULL, 'test-welcome@oicshepherd.test', false, NULL, NULL, true, true, true, true, true, true),
	('72caf16e-bbbf-4154-8bc2-3800a4ea1e01', '72caf16e-bbbf-4154-8bc2-3800a4ea1e01', 'test-shepherd', 'shepherd', NULL, NULL, NULL, 'test-shepherd@oicshepherd.test', false, NULL, NULL, true, true, true, true, true, true),
	('bd83730a-aead-4824-a21e-bb1368832bb3', 'bd83730a-aead-4824-a21e-bb1368832bb3', 'test-admin', 'admin', NULL, NULL, NULL, 'test-admin@oicshepherd.test', false, NULL, NULL, true, true, true, true, true, true);


-- ============================================================
-- PERSONA PEOPLE
-- (which people each persona has been assigned to shepherd)
-- ============================================================

INSERT INTO "public"."persona_people" ("persona_id", "person_id") VALUES
	-- mock-admin sees all non-test people
	('mock-admin', 'samuel-chen'),
	('mock-admin', 'grace-park'),
	('mock-admin', 'michael-torres'),
	('mock-admin', 'emma-davis'),
	('mock-admin', 'david-kim'),
	('mock-admin', 'sarah-kim'),
	('mock-admin', 'james-wilson'),
	('mock-admin', 'mei-zhang'),
	('mock-admin', 'peter-yang'),
	('mock-admin', 'jennifer-lee'),
	('mock-admin', 'kevin-lee'),
	('mock-admin', 'angela-white'),
	('mock-admin', 'jessica-chen'),
	('mock-admin', 'robert-hall'),
	('mock-admin', 'linda-hall'),
	('mock-admin', 'chris-anderson'),
	('mock-admin', 'olivia-taylor'),
	('mock-admin', 'henry-nguyen'),
	('mock-admin', 'william-zhang'),
	('mock-admin', 'lisa-johnson'),
	('mock-admin', 'thomas-brown'),
	('mock-admin', 'priya-patel'),
	('mock-admin', 'ryan-murphy'),
	('mock-admin', 'sophie-martin'),
	('mock-admin', 'noah-garcia'),
	-- mock-shepherd-1 (Grace Park) flock
	('mock-shepherd-1', 'samuel-chen'),
	('mock-shepherd-1', 'grace-park'),
	('mock-shepherd-1', 'james-wilson'),
	('mock-shepherd-1', 'mei-zhang'),
	('mock-shepherd-1', 'peter-yang'),
	('mock-shepherd-1', 'jennifer-lee'),
	('mock-shepherd-1', 'kevin-lee'),
	('mock-shepherd-1', 'angela-white'),
	('mock-shepherd-1', 'jessica-chen'),
	-- mock-shepherd-2 (Michael Torres) flock
	('mock-shepherd-2', 'samuel-chen'),
	('mock-shepherd-2', 'michael-torres'),
	('mock-shepherd-2', 'chris-anderson'),
	('mock-shepherd-2', 'olivia-taylor'),
	('mock-shepherd-2', 'henry-nguyen'),
	('mock-shepherd-2', 'william-zhang'),
	('mock-shepherd-2', 'priya-patel'),
	('mock-shepherd-2', 'ryan-murphy'),
	-- mock-welcome (Emma Davis) — sees newcomers + visitors
	('mock-welcome', 'emma-davis'),
	('mock-welcome', 'priya-patel'),
	('mock-welcome', 'ryan-murphy'),
	('mock-welcome', 'sophie-martin');


-- ============================================================
-- VISITOR SUBMISSIONS
-- Covers: pending + promoted statuses, qr + app sources.
-- ============================================================

INSERT INTO "public"."visitor_submissions" ("id", "submitted_at", "submitted_by", "source", "status", "person_id", "preferred_name", "last_name", "phone", "email", "is_student", "languages", "referral_source", "referral_detail", "interests", "prayer_request", "alternative_name") VALUES
	-- pending, qr source (came from welcome page QR code)
	('a1000001-0000-0000-0000-000000000001', '2026-05-15 10:30:00+00', NULL, 'qr', 'pending', NULL, 'Sophie', 'Martin', NULL, NULL, false, '{English}', NULL, NULL, '{growth,community}', 'Praying for a new start in a new city.', NULL),
	-- pending, app source (added manually by shepherd)
	('a1000002-0000-0000-0000-000000000002', '2026-05-14 14:00:00+00', 'mock-shepherd-2', 'app', 'pending', NULL, 'Alex', 'Reyes', '(555) 500-0099', NULL, true, '{English,Spanish}', 'friend', 'Came with Ryan Murphy', '{salvation,growth}', NULL, NULL),
	-- promoted, qr source (linked to an existing person)
	('a1000003-0000-0000-0000-000000000003', '2026-04-28 11:00:00+00', NULL, 'qr', 'promoted', 'priya-patel', 'Priya', 'Patel', '(555) 401-0101', 'priya.patel@mock.test', false, '{English}', 'online', NULL, '{community}', NULL, NULL),
	-- promoted, app source
	('a1000004-0000-0000-0000-000000000004', '2026-05-02 09:30:00+00', 'mock-shepherd-2', 'app', 'promoted', 'ryan-murphy', 'Ryan', 'Murphy', '(555) 401-0201', NULL, false, '{English}', 'friend', 'Invited by Chris Anderson', '{growth}', NULL, NULL),
	-- test-persona-created
	('267a964e-c142-4194-9584-d2f65236fa03', '2026-05-15 16:03:50.84849+00', NULL, 'qr', 'pending', NULL, 'QR Test Submission', 'TestQR', NULL, NULL, false, '{English}', NULL, NULL, '{salvation,growth}', NULL, NULL),
	('6bfe287a-0996-4918-873c-967a47774fcc', '2026-05-15 16:06:41.917+00', 'bd83730a-aead-4824-a21e-bb1368832bb3', 'app', 'promoted', 'mp74139kmmadg', 'Test Visitor Alpha', NULL, NULL, NULL, false, '{English}', NULL, NULL, '{}', NULL, NULL),
	('6b9f0165-815a-465a-b297-ae6b711950d3', '2026-05-15 15:40:03.001+00', '72caf16e-bbbf-4154-8bc2-3800a4ea1e01', 'app', 'promoted', NULL, 'Test', 'User', '123-456-789', NULL, false, '{English}', NULL, NULL, '{}', NULL, NULL);


--
-- Mock seed complete.
--

RESET ALL;
