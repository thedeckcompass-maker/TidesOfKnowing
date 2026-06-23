alter table public.community_posts
add column if not exists image_url text;

create index if not exists community_posts_image_url_created_idx
on public.community_posts(created_at desc)
where image_url is not null;

insert into storage.buckets (id, name, public)
values ('community-spread-images', 'community-spread-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read community spread images" on storage.objects;
create policy "Public can read community spread images"
on storage.objects for select
using (bucket_id = 'community-spread-images');

drop policy if exists "Members can upload community spread images" on storage.objects;
create policy "Members can upload community spread images"
on storage.objects for insert
with check (bucket_id = 'community-spread-images' and auth.role() = 'authenticated');
