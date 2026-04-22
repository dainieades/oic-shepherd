-- ── Notices RLS ───────────────────────────────────────────────
alter table public.notices enable row level security;

create policy "notices_select" on public.notices for select using (
  auth.uid() is not null and (
    -- admin sees everything regardless of privacy
    exists (
      select 1 from personas
      where user_id = auth.uid() and role = 'admin'
    )
    or
    -- 'everyone' privacy: all authenticated users
    privacy = 'everyone'
    or
    -- 'pastor-and-shepherds': admin or shepherd role
    (
      privacy = 'pastor-and-shepherds'
      and exists (
        select 1 from personas
        where user_id = auth.uid() and role in ('admin', 'shepherd')
      )
    )
  )
);

create policy "notices_insert" on public.notices for insert with check (
  auth.uid() is not null and
  created_by = (select id from personas where user_id = auth.uid() limit 1)
);

create policy "notices_update" on public.notices for update using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);

create policy "notices_delete" on public.notices for delete using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);
