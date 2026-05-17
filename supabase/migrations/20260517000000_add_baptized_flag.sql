alter table people
  add column if not exists baptized boolean not null default false;

-- Members are assumed baptized by default
update people set baptized = true where membership_status = 'member' and baptized = false;
