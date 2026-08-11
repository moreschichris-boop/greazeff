-- Migration: adds a Supabase Storage bucket so photos can be uploaded
-- directly from the admin panel instead of only pasting an image URL.
-- Paste into a new SQL Editor query and Run, same as your other migrations.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Open policies (matches the rest of the site's "PIN gate in the UI, open
-- RLS underneath" pattern) so uploads work with just the anon key.
create policy "Public read photos bucket" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Public upload photos bucket" on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "Public update photos bucket" on storage.objects
  for update using (bucket_id = 'photos');

create policy "Public delete photos bucket" on storage.objects
  for delete using (bucket_id = 'photos');
