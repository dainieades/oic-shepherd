alter table personas
  add column if not exists theme_preference text check (theme_preference in ('light', 'dark', 'system')),
  add column if not exists map_provider     text check (map_provider in ('apple', 'google', 'waze'));
