-- Re-create RLS policies for notes and todos.
-- These were dropped when the remote schema disabled RLS on both tables
-- (20260404184647_remote_schema.sql). Re-enabling RLS in 20260422000000 left
-- no policies in place, blocking all reads including for admins.

-- ── Notes ────────────────────────────────────────────────────────────────────

drop policy if exists "notes_select" on public.notes;
create policy "notes_select" on public.notes for select using (
  auth.uid() is not null and (
    exists (
      select 1 from personas
      where user_id = auth.uid() and role = 'admin'
    )
    or
    created_by = (select id from personas where user_id = auth.uid() limit 1)
    or
    (
      visibility = 'public'
      and person_id in (
        select pp.person_id
        from persona_people pp
        join personas p on p.id = pp.persona_id
        where p.user_id = auth.uid()
      )
    )
    or
    (
      visibility = 'public'
      and family_id in (
        select f.id
        from families f
        join family_members fm on fm.family_id = f.id
        join persona_people pp on pp.person_id = fm.person_id
        join personas p on p.id = pp.persona_id
        where p.user_id = auth.uid()
      )
    )
  )
);

drop policy if exists "notes_insert" on public.notes;
create policy "notes_insert" on public.notes for insert with check (
  auth.uid() is not null and
  created_by = (select id from personas where user_id = auth.uid() limit 1)
);

drop policy if exists "notes_update" on public.notes;
create policy "notes_update" on public.notes for update using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
);

drop policy if exists "notes_delete" on public.notes;
create policy "notes_delete" on public.notes for delete using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);

-- ── Todos ────────────────────────────────────────────────────────────────────

drop policy if exists "todos_select" on public.todos;
create policy "todos_select" on public.todos for select using (
  auth.uid() is not null and (
    exists (
      select 1 from personas
      where user_id = auth.uid() and role = 'admin'
    )
    or
    created_by = (select id from personas where user_id = auth.uid() limit 1)
    or
    person_id in (
      select pp.person_id
      from persona_people pp
      join personas p on p.id = pp.persona_id
      where p.user_id = auth.uid()
    )
  )
);

drop policy if exists "todos_insert" on public.todos;
create policy "todos_insert" on public.todos for insert with check (
  auth.uid() is not null and
  created_by = (select id from personas where user_id = auth.uid() limit 1)
);

drop policy if exists "todos_update" on public.todos;
create policy "todos_update" on public.todos for update using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);

drop policy if exists "todos_delete" on public.todos;
create policy "todos_delete" on public.todos for delete using (
  created_by = (select id from personas where user_id = auth.uid() limit 1)
  or exists (select 1 from personas where user_id = auth.uid() and role = 'admin')
);
