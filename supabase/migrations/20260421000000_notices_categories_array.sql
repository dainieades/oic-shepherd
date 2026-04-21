-- Migrate notices.category (text) → notices.categories (text[])
-- Also extends allowed values with 'social-need' and 'psychological-need'

alter table notices
  add column if not exists categories text[] not null default '{}';

update notices
  set categories = ARRAY[category]
  where categories = '{}';

alter table notices
  drop column if exists category;
