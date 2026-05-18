-- Add life_stage array to replace the single is_student boolean.
-- is_student is retained for seed.sql compatibility and will be dropped in a future cleanup.
ALTER TABLE people ADD COLUMN life_stage text[] NOT NULL DEFAULT '{}';
ALTER TABLE visitor_submissions ADD COLUMN life_stage text[] NOT NULL DEFAULT '{}';
