-- Local-only extras applied by scripts/local-bootstrap.sh after `supabase db reset`.
-- Survives `supabase db dump --data-only` (which only rewrites seed.sql).
-- All inserts are ON CONFLICT DO NOTHING so the script is idempotent.

-- Notices: spread across people from different shepherds, varied urgencies / categories / privacy.
INSERT INTO "public"."notices" ("id", "person_id", "family_id", "urgency", "content", "created_by", "created_at", "privacy", "categories") VALUES
	('local-extra-notice-01', 'daini-eades',     NULL, 'urgent',   'Wrestling through a tough season at work — covet prayer for wisdom.',                'shepherd-1',   '2026-05-13 14:05:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('local-extra-notice-02', 'daini-eades',     NULL, 'moderate', 'Hosting newcomers'' lunch this Sunday — looking for one more couple to help.',       'daini-eades',  '2026-05-14 09:20:00+00', 'everyone',             '{social-need}'),
	('local-extra-notice-03', 'fangyu-ai',       NULL, 'ongoing',  'Recovering from minor surgery; meals appreciated through end of month.',             'admin',        '2026-05-12 18:40:00+00', 'pastor-and-shepherds', '{physical-need}'),
	('local-extra-notice-04', 'chris-nixon',     NULL, 'urgent',   'Mentioned heightened anxiety after a job loss — please follow up gently.',           'admin',        '2026-05-15 08:15:00+00', 'pastor-only',          '{psychological-need}'),
	('local-extra-notice-05', 'chris-nixon',     NULL, 'ongoing',  'Looking for connections in the men''s small group.',                                 'shepherd-2',   '2026-05-10 19:00:00+00', 'pastor-and-shepherds', '{social-need}'),
	('local-extra-notice-06', 'marni-thompson',  NULL, 'moderate', 'Asking questions about baptism — would value a conversation.',                       'shepherd-2',   '2026-05-13 11:30:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('local-extra-notice-07', 'leanne-hanson',   NULL, 'urgent',   'Husband admitted to ICU; needs rides to hospital this week.',                        'shepherd-2',   '2026-05-15 06:45:00+00', 'pastor-and-shepherds', '{physical-need,social-need}'),
	('local-extra-notice-08', 'peter-zhuang',    NULL, 'ongoing',  'Job-hunting in the area; happy to network with anyone in tech.',                     'welcome-team', '2026-05-09 15:10:00+00', 'everyone',             '{other}'),
	('local-extra-notice-09', 'deborah-liu',     NULL, 'moderate', 'Caregiver fatigue; mother-in-law moved in last month.',                              'shepherd-1',   '2026-05-11 20:25:00+00', 'pastor-and-shepherds', '{psychological-need,physical-need}'),
	('local-extra-notice-10', 'tom-mullett',     NULL, 'urgent',   'Considering walking away from faith — please pray and reach out this week.',         'admin',        '2026-05-14 22:00:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('local-extra-notice-11', 'tom-mullett',     NULL, 'ongoing',  'Chronic back pain limits how long he can stand on Sundays.',                         'shepherd-1',   '2026-05-08 10:00:00+00', 'everyone',             '{physical-need}')
ON CONFLICT ("id") DO NOTHING;
