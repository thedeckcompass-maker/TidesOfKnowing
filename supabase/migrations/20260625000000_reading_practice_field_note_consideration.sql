alter table public.community_posts
add column if not exists field_note_consideration boolean not null default false;

comment on column public.community_posts.field_note_consideration is
'Reader opt-in for considering a Reading Practice discussion as the basis for a future Field Note.';

create index if not exists community_posts_field_note_consideration_created_idx
on public.community_posts(created_at desc)
where field_note_consideration = true;
