drop policy if exists "authenticated_update_people" on people;

create policy "authenticated_update_people" on people
  for update using (
    id = (select person_id from personas where user_id = auth.uid() limit 1)
    or exists (
      select 1 from personas where user_id = auth.uid() and role = 'admin'
    )
  );
