insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can read photos" on storage.objects;
create policy "Authenticated users can read photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos');

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "Authenticated users can update photos" on storage.objects;
create policy "Authenticated users can update photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos');

drop policy if exists "Authenticated users can delete photos" on storage.objects;
create policy "Authenticated users can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');
