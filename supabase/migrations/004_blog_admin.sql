create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  cover_url text,
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure public.set_updated_at();

alter table public.blog_posts enable row level security;

create policy "blog_public_read" on public.blog_posts
  for select using (is_published = true);

alter table public.profiles add column if not exists is_admin boolean default false;

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict do nothing;

create policy "gallery_public_read" on storage.objects
  for select using (bucket_id = 'gallery');

create policy "gallery_admin_upload" on storage.objects
  for insert with check (bucket_id = 'gallery');

create policy "gallery_admin_delete" on storage.objects
  for delete using (bucket_id = 'gallery');

create policy "blog_public_read" on storage.objects
  for select using (bucket_id = 'blog');

create policy "blog_admin_upload" on storage.objects
  for insert with check (bucket_id = 'blog');
