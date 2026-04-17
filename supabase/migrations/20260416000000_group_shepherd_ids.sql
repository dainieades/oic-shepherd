-- Add shepherd_ids column to groups table
alter table groups add column if not exists shepherd_ids text[] default '{}';
