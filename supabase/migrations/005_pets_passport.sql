alter table public.pets
  add column if not exists passport_full_name text,
  add column if not exists passport_photo_url text;

insert into storage.buckets (id, name, public)
values ('passports', 'passports', true)
on conflict do nothing;

create policy "passports_public_read" on storage.objects
  for select using (bucket_id = 'passports');

create policy "passports_owner_upload" on storage.objects
  for insert with check (bucket_id = 'passports');

create policy "passports_owner_delete" on storage.objects
  for delete using (bucket_id = 'passports');
