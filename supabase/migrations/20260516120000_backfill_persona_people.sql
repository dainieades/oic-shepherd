-- Backfill persona_people from person_shepherds.
--
-- Background: assignShepherds / assignShepherdsToFamily historically wrote
-- only to person_shepherds. persona_people was populated only by seed.sql,
-- so any shepherd assignment made through the UI in production left the
-- persona's assignedPeopleIds empty. Downstream effects (admins and
-- shepherds both):
--   • person detail page hides the Logs / To-dos tabs (canManage check)
--   • RLS on todos / notes / notices filters out every row
--   • /todos and /logs "mine" filter resolves to an empty set
--
-- The code has been updated to keep persona_people in sync going forward;
-- this backfill repairs existing rows. Only person_shepherds.shepherd_id
-- values that match a personas.id get inserted (some shepherds are stored
-- as person ids when they have no persona, and persona_people.persona_id
-- has a FK to personas).

INSERT INTO "public"."persona_people" ("persona_id", "person_id")
SELECT ps."shepherd_id", ps."person_id"
FROM "public"."person_shepherds" ps
JOIN "public"."personas" p ON p."id" = ps."shepherd_id"
ON CONFLICT ("persona_id", "person_id") DO NOTHING;
