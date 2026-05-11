-- Drop shepherd_ids column from groups table.
-- The Shepherd concept on groups has been removed; groups now have only leaders and members.
alter table groups drop column if exists shepherd_ids;
