alter table public.community_sections
drop constraint if exists community_sections_key_check;

alter table public.community_sections
add constraint community_sections_key_check
check (key in ('reading-practice', 'reader-development', 'deck-creation'));

insert into public.community_sections (key, name, description, display_order)
values (
  'deck-creation',
  'Deck Creation',
  'Discuss deck concepts, symbolism, card and guidebook writing, artwork, testing, production, publishing and launch decisions.',
  3
)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = true;

alter table public.community_posts
add column if not exists audience text not null default 'public',
add column if not exists source_kind text not null default 'member_post',
add column if not exists deck_creation_topic text;

alter table public.community_posts
drop constraint if exists community_posts_audience_check,
drop constraint if exists community_posts_source_kind_check,
drop constraint if exists community_posts_deck_creation_topic_check;

alter table public.community_posts
add constraint community_posts_audience_check
check (audience in ('public', 'members')),
add constraint community_posts_source_kind_check
check (source_kind in ('member_post', 'studio_excerpt', 'teaching')),
add constraint community_posts_deck_creation_topic_check
check (
  deck_creation_topic is null
  or deck_creation_topic in (
    'introduction',
    'concept_symbolism',
    'cards_guidebook',
    'artwork_collaboration',
    'testing_refinement',
    'production_publishing',
    'crowdfunding_launch',
    'workshop_question',
    'progress_reflection'
  )
);

-- Existing published discussions remain public. New discussions default to the
-- member space unless the author deliberately chooses public visibility.
alter table public.community_posts alter column audience set default 'members';

create index if not exists community_posts_audience_created_idx
on public.community_posts(audience, created_at desc)
where status in ('published', 'locked');

create index if not exists community_posts_deck_topic_created_idx
on public.community_posts(deck_creation_topic, created_at desc)
where deck_creation_topic is not null;

alter table public.studio_journal_excerpts
drop constraint if exists studio_journal_excerpts_purpose_check;

alter table public.studio_journal_excerpts
add constraint studio_journal_excerpts_purpose_check
check (purpose in ('kickstarter', 'newsletter', 'social', 'case_study', 'community', 'private_record'));

create table if not exists public.studio_community_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.studio_projects(id) on delete set null,
  journal_excerpt_id uuid references public.studio_journal_excerpts(id) on delete set null,
  community_post_id uuid not null unique references public.community_posts(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  audience text not null check (audience in ('public', 'members')),
  topic text not null check (
    topic in (
      'introduction',
      'concept_symbolism',
      'cards_guidebook',
      'artwork_collaboration',
      'testing_refinement',
      'production_publishing',
      'crowdfunding_launch',
      'workshop_question',
      'progress_reflection'
    )
  ),
  community_slug text not null,
  title_snapshot text not null check (char_length(title_snapshot) between 1 and 160),
  excerpt_snapshot text not null check (char_length(excerpt_snapshot) between 1 and 5000),
  shared_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_community_shares_withdrawn_check
    check (withdrawn_at is null or withdrawn_at >= shared_at)
);

create unique index if not exists studio_community_active_excerpt_idx
on public.studio_community_shares(journal_excerpt_id)
where journal_excerpt_id is not null and withdrawn_at is null;

create index if not exists studio_community_owner_created_idx
on public.studio_community_shares(owner_id, created_at desc);

drop trigger if exists studio_community_shares_set_updated_at on public.studio_community_shares;
create trigger studio_community_shares_set_updated_at
before update on public.studio_community_shares
for each row execute function public.set_updated_at();

alter table public.studio_community_shares enable row level security;

drop policy if exists "Creators can read own Studio community shares" on public.studio_community_shares;
create policy "Creators can read own Studio community shares"
on public.studio_community_shares for select
using (owner_id = auth.uid() and public.studio_has_read_access());

drop policy if exists "Administrators can read Studio community shares" on public.studio_community_shares;
create policy "Administrators can read Studio community shares"
on public.studio_community_shares for select
using (public.is_admin());

drop policy if exists "Public can read published posts" on public.community_posts;
create policy "Visible readers can read published posts"
on public.community_posts for select
using (
  status in ('published', 'locked')
  and (audience = 'public' or public.is_active_member())
);

drop policy if exists "Authors can edit own posts" on public.community_posts;
create policy "Authors can edit own posts"
on public.community_posts for update
using (
  auth.uid() = author_id
  and status = 'published'
  and source_kind = 'member_post'
  and public.is_active_member()
)
with check (
  auth.uid() = author_id
  and status = 'published'
  and source_kind = 'member_post'
  and is_pinned = false
  and pinned_at is null
  and public.is_active_member()
);

drop policy if exists "Public can read published replies" on public.community_replies;
create policy "Visible readers can read published replies"
on public.community_replies for select
using (
  status = 'published'
  and exists (
    select 1
    from public.community_posts p
    where p.id = post_id
      and p.status in ('published', 'locked')
      and (p.audience = 'public' or public.is_active_member())
  )
);

create or replace function public.studio_share_journal_excerpt(
  target_excerpt_id uuid,
  target_audience text,
  target_topic text,
  target_slug text,
  deliberate_share_confirmed boolean,
  public_visibility_confirmed boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_excerpt record;
  section_uuid uuid;
  new_post_id uuid;
  new_share_id uuid;
begin
  if auth.uid() is null or not public.is_active_member() or not public.studio_has_write_access() then
    return jsonb_build_object('ok', false, 'error', 'access');
  end if;

  if deliberate_share_confirmed is not true then
    return jsonb_build_object('ok', false, 'error', 'confirmation');
  end if;

  if target_audience not in ('public', 'members') then
    return jsonb_build_object('ok', false, 'error', 'audience');
  end if;

  if target_audience = 'public' and public_visibility_confirmed is not true then
    return jsonb_build_object('ok', false, 'error', 'public_confirmation');
  end if;

  if target_topic not in (
    'introduction',
    'concept_symbolism',
    'cards_guidebook',
    'artwork_collaboration',
    'testing_refinement',
    'production_publishing',
    'crowdfunding_launch',
    'workshop_question',
    'progress_reflection'
  ) then
    return jsonb_build_object('ok', false, 'error', 'topic');
  end if;

  if target_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(target_slug) > 90 then
    return jsonb_build_object('ok', false, 'error', 'slug');
  end if;

  select e.id, e.project_id, e.title, e.excerpt_text, p.owner_id
  into source_excerpt
  from public.studio_journal_excerpts e
  join public.studio_projects p on p.id = e.project_id
  where e.id = target_excerpt_id
    and p.owner_id = auth.uid();

  if source_excerpt.id is null or source_excerpt.owner_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'excerpt');
  end if;

  if exists (
    select 1
    from public.studio_community_shares
    where journal_excerpt_id = target_excerpt_id
      and withdrawn_at is null
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_shared');
  end if;

  select id into section_uuid
  from public.community_sections
  where key = 'deck-creation' and is_active = true;

  if section_uuid is null then
    return jsonb_build_object('ok', false, 'error', 'section');
  end if;

  insert into public.community_posts (
    section_id,
    author_id,
    title,
    slug,
    body,
    status,
    audience,
    source_kind,
    deck_creation_topic,
    field_note_consideration
  )
  values (
    section_uuid,
    auth.uid(),
    source_excerpt.title,
    target_slug,
    source_excerpt.excerpt_text,
    'published',
    target_audience,
    'studio_excerpt',
    target_topic,
    false
  )
  returning id into new_post_id;

  insert into public.studio_community_shares (
    project_id,
    journal_excerpt_id,
    community_post_id,
    owner_id,
    audience,
    topic,
    community_slug,
    title_snapshot,
    excerpt_snapshot
  )
  values (
    source_excerpt.project_id,
    source_excerpt.id,
    new_post_id,
    auth.uid(),
    target_audience,
    target_topic,
    target_slug,
    source_excerpt.title,
    source_excerpt.excerpt_text
  )
  returning id into new_share_id;

  return jsonb_build_object(
    'ok', true,
    'share_id', new_share_id,
    'post_id', new_post_id,
    'slug', target_slug
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'conflict');
end;
$$;

create or replace function public.studio_withdraw_community_share(target_share_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_share public.studio_community_shares%rowtype;
begin
  if auth.uid() is null or not public.studio_has_write_access() then
    return jsonb_build_object('ok', false, 'error', 'access');
  end if;

  select * into source_share
  from public.studio_community_shares
  where id = target_share_id
    and owner_id = auth.uid()
    and withdrawn_at is null
  for update;

  if source_share.id is null then
    return jsonb_build_object('ok', false, 'error', 'share');
  end if;

  update public.community_posts
  set status = 'hidden'
  where id = source_share.community_post_id
    and author_id = auth.uid()
    and source_kind = 'studio_excerpt';

  update public.studio_community_shares
  set withdrawn_at = now()
  where id = source_share.id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.studio_share_journal_excerpt(uuid, text, text, text, boolean, boolean) from public;
revoke all on function public.studio_withdraw_community_share(uuid) from public;
grant execute on function public.studio_share_journal_excerpt(uuid, text, text, text, boolean, boolean) to authenticated;
grant execute on function public.studio_withdraw_community_share(uuid) to authenticated;

comment on table public.studio_community_shares is
  'Audit link between a private controlled journal excerpt and a separate community copy. Source project and journal privacy never change.';
comment on column public.community_posts.audience is
  'Members is the default. Public visibility must be chosen deliberately and may be indexed.';
comment on column public.community_posts.source_kind is
  'Identifies ordinary discussions, deliberate Studio excerpt copies and curated teaching posts without exposing a private source.';
