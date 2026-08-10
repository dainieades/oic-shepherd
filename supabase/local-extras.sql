-- Local-only extras applied by scripts/local-bootstrap.sh after `supabase db reset`.
-- Survives `supabase db dump --data-only` (which only rewrites seed.sql).
-- All inserts are ON CONFLICT DO NOTHING so the script is idempotent.

-- Notices: spread across people from different shepherds, varied urgencies / categories / privacy.
INSERT INTO "public"."notices" ("id", "person_id", "family_id", "urgency", "content", "created_by", "created_at", "privacy", "categories") VALUES
	('local-extra-notice-01', 'james-wilson',    NULL, 'urgent',   'Still wrestling with whether Christianity is true — having real doubts. Needs patient, thoughtful engagement.',                     'mock-shepherd-1', '2026-05-13 14:05:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('local-extra-notice-02', 'james-wilson',    NULL, 'moderate', 'Would love someone to sit with him during service so he feels less alone.',                                                         'mock-shepherd-1', '2026-05-14 09:20:00+00', 'everyone',             '{social-need}'),
	('local-extra-notice-03', 'mei-zhang',       NULL, 'ongoing',  'Recovering from minor surgery; meals would be appreciated through end of the month.',                                               'mock-admin',      '2026-05-12 18:40:00+00', 'pastor-and-shepherds', '{physical-need}'),
	('local-extra-notice-04', 'lisa-johnson',    NULL, 'urgent',   'Going through a difficult season post-divorce — heightened anxiety. Please follow up gently and confidentially.',                  'mock-admin',      '2026-05-15 08:15:00+00', 'pastor-only',          '{psychological-need}'),
	('local-extra-notice-05', 'chris-anderson',  NULL, 'ongoing',  'Looking for deeper connections with other young men in the church.',                                                                'mock-shepherd-2', '2026-05-10 19:00:00+00', 'pastor-and-shepherds', '{social-need}'),
	('local-extra-notice-06', 'jennifer-lee',    NULL, 'moderate', 'Asking questions about baptism — would value a one-on-one conversation with Pastor Samuel.',                                       'mock-shepherd-1', '2026-05-13 11:30:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('local-extra-notice-07', 'linda-hall',      NULL, 'urgent',   'Linda has been unwell this week — Robert is caring for her at home. Family may need practical support.',                          'mock-admin',      '2026-05-15 06:45:00+00', 'pastor-and-shepherds', '{physical-need,social-need}'),
	('local-extra-notice-08', 'ryan-murphy',     NULL, 'ongoing',  'Job-hunting in the area — open to connecting with anyone in engineering or tech.',                                                  'mock-welcome',    '2026-05-09 15:10:00+00', 'everyone',             '{other}'),
	('local-extra-notice-09', 'henry-nguyen',    NULL, 'moderate', 'Caregiver fatigue — his mother has moved in and he is balancing work and family care.',                                            'mock-shepherd-2', '2026-05-11 20:25:00+00', 'pastor-and-shepherds', '{psychological-need,physical-need}'),
	('local-extra-notice-10', 'william-zhang',   NULL, 'urgent',   'Mentioned feeling spiritually adrift — not fully connected to either English or Mandarin congregation. Needs intentional care.',  'mock-shepherd-2', '2026-05-14 22:00:00+00', 'pastor-and-shepherds', '{spiritual-need}'),
	('local-extra-notice-11', 'thomas-brown',    NULL, 'ongoing',  'Chronic knee pain limits standing during worship. He appreciates being remembered even when absent.',                             'mock-admin',      '2026-05-08 10:00:00+00', 'everyone',             '{physical-need}')
ON CONFLICT ("id") DO NOTHING;

-- Pending newcomer submissions for exercising the /visitors/pending "Add to directory" flow,
-- including duplicate-name scenarios (an exact match and a typo'd fuzzy match against existing
-- people) plus one clean, non-duplicate card.
INSERT INTO "public"."visitor_submissions"
	("id", "submitted_at", "source", "status", "preferred_name", "last_name", "phone", "email", "is_student", "life_stage", "languages", "referral_source", "referral_detail", "interests", "prayer_request")
VALUES
	('00000000-0000-0000-0000-00000000d001', now() - interval '2 hours',  'app', 'pending', 'James',   'Wilson',  '555-201-0001', 'james.newcomer@example.com', false, '{Young Professional}', '{English}', 'friend', 'Invited by a coworker',     '{salvation,small-groups}', 'Would love prayer for a new job.'),
	('00000000-0000-0000-0000-00000000d002', now() - interval '1 day',    'qr',  'pending', 'Jenifer', 'Lee',     '555-201-0002', NULL,                          false, '{Family}',              '{English}', 'flyer',  NULL,                         '{growth}',                  NULL),
	('00000000-0000-0000-0000-00000000d003', now() - interval '5 hours',  'app', 'pending', 'Marcus',  'Bennett', '555-201-0003', 'marcus.bennett@example.com',  false, '{Student}',             '{English}', 'online', NULL,                         '{serving,small-groups}',   'Praying for direction after moving to the area.')
ON CONFLICT ("id") DO NOTHING;
