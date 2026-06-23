create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Reader',
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'active' check (status in ('active', 'restricted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.community_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  display_order integer not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint community_sections_key_check check (key in ('reading-practice', 'reader-development'))
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.community_sections(id),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 8 and 140),
  slug text not null unique,
  body text not null check (char_length(body) between 20 and 12000),
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted', 'locked')),
  is_pinned boolean not null default false,
  pinned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 8000),
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_replies_to_posts boolean not null default true,
  email_announcements boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  reply_id uuid references public.community_replies(id) on delete cascade,
  event_type text not null check (event_type in ('reply_to_post', 'announcement')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.community_posts(id) on delete set null,
  reply_id uuid references public.community_replies(id) on delete set null,
  action text not null check (
    action in (
      'pin_post',
      'unpin_post',
      'hide_post',
      'delete_post',
      'restore_post',
      'hide_reply',
      'delete_reply',
      'restore_reply',
      'restrict_user',
      'block_user',
      'restore_user'
    )
  ),
  reason text,
  created_at timestamptz not null default now()
);

insert into public.community_sections (key, name, description, display_order)
values
  (
    'reading-practice',
    'Reading Practice',
    'Share cards, spread interpretations, difficult combinations, clarification questions, symbolic observations, and reading dilemmas. The emphasis is learning and practice, not prediction.',
    1
  ),
  (
    'reader-development',
    'Reader Development',
    'Grow as a reader through intuition, ethics, confidence, journaling, boundaries, symbolic literacy, reflective practice, and trust in yourself.',
    2
  )
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = true;

create index if not exists profiles_role_status_idx on public.profiles(role, status);
create index if not exists community_sections_active_order_idx on public.community_sections(is_active, display_order);
create index if not exists community_posts_section_pinned_created_idx on public.community_posts(section_id, is_pinned desc, created_at desc);
create index if not exists community_posts_status_created_idx on public.community_posts(status, created_at desc);
create index if not exists community_posts_author_created_idx on public.community_posts(author_id, created_at desc);
create index if not exists community_posts_search_idx on public.community_posts using gin(search_vector);
create index if not exists community_replies_post_created_idx on public.community_replies(post_id, created_at asc);
create index if not exists notification_events_status_created_idx on public.notification_events(status, created_at asc);
create index if not exists moderation_actions_created_idx on public.moderation_actions(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
before update on public.community_posts
for each row execute function public.set_updated_at();

drop trigger if exists community_replies_set_updated_at on public.community_replies;
create trigger community_replies_set_updated_at
before update on public.community_replies
for each row execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Reader')
  )
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_active_member(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.community_sections enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.moderation_actions enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable"
on public.profiles for select
using (status <> 'blocked');

drop policy if exists "Members can update own basic profile" on public.profiles;
create policy "Members can update own basic profile"
on public.profiles for update
using (auth.uid() = id and role = 'member' and status = 'active')
with check (auth.uid() = id and role = 'member' and status = 'active');

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active sections" on public.community_sections;
create policy "Public can read active sections"
on public.community_sections for select
using (is_active = true);

drop policy if exists "Public can read published posts" on public.community_posts;
create policy "Public can read published posts"
on public.community_posts for select
using (status = 'published');

drop policy if exists "Active members can create posts" on public.community_posts;
create policy "Active members can create posts"
on public.community_posts for insert
with check (auth.uid() = author_id and public.is_active_member());

drop policy if exists "Authors can edit own posts" on public.community_posts;
create policy "Authors can edit own posts"
on public.community_posts for update
using (auth.uid() = author_id and status = 'published' and public.is_active_member())
with check (
  auth.uid() = author_id
  and status = 'published'
  and is_pinned = false
  and pinned_at is null
  and public.is_active_member()
);

drop policy if exists "Admins can moderate posts" on public.community_posts;
create policy "Admins can moderate posts"
on public.community_posts for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read published replies" on public.community_replies;
create policy "Public can read published replies"
on public.community_replies for select
using (
  status = 'published'
  and exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status = 'published'
  )
);

drop policy if exists "Active members can create replies" on public.community_replies;
create policy "Active members can create replies"
on public.community_replies for insert
with check (
  auth.uid() = author_id
  and public.is_active_member()
  and exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status = 'published'
  )
);

drop policy if exists "Authors can edit own replies" on public.community_replies;
create policy "Authors can edit own replies"
on public.community_replies for update
using (auth.uid() = author_id and status = 'published' and public.is_active_member())
with check (auth.uid() = author_id and status = 'published' and public.is_active_member());

drop policy if exists "Admins can moderate replies" on public.community_replies;
create policy "Admins can moderate replies"
on public.community_replies for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Members can read own notification preferences" on public.notification_preferences;
create policy "Members can read own notification preferences"
on public.notification_preferences for select
using (auth.uid() = user_id);

drop policy if exists "Members can update own notification preferences" on public.notification_preferences;
create policy "Members can update own notification preferences"
on public.notification_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Members can insert own notification preferences" on public.notification_preferences;
create policy "Members can insert own notification preferences"
on public.notification_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "Members can read own notification events" on public.notification_events;
create policy "Members can read own notification events"
on public.notification_events for select
using (auth.uid() = recipient_user_id);

drop policy if exists "Admins can manage notification events" on public.notification_events;
create policy "Admins can manage notification events"
on public.notification_events for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read moderation actions" on public.moderation_actions;
create policy "Admins can read moderation actions"
on public.moderation_actions for select
using (public.is_admin());

drop policy if exists "Admins can create moderation actions" on public.moderation_actions;
create policy "Admins can create moderation actions"
on public.moderation_actions for insert
with check (public.is_admin() and auth.uid() = admin_user_id);

create or replace function public.seed_practice_commons_starter_threads(author_email text)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  author_uuid uuid;
  reading_section uuid;
  development_section uuid;
  inserted_count integer := 0;
begin
  select id into author_uuid
  from auth.users
  where lower(email) = lower(author_email)
  limit 1;

  if author_uuid is null then
    raise exception 'No auth user found for %', author_email;
  end if;

  insert into public.profiles (id, display_name)
  values (author_uuid, split_part(author_email, '@', 1))
  on conflict (id) do nothing;

  select id into reading_section
  from public.community_sections
  where key = 'reading-practice';

  select id into development_section
  from public.community_sections
  where key = 'reader-development';

  insert into public.community_posts (section_id, author_id, title, slug, body)
  values
    (
      reading_section,
      author_uuid,
      'How do you know when you are forcing an interpretation?',
      'how-do-you-know-when-you-are-forcing-an-interpretation',
      'A practice question for the Commons: what tells you that you have moved from listening to the cards into trying to make them say something? Share the signs you notice in your body, your language, or the spread itself.'
    ),
    (
      reading_section,
      author_uuid,
      'What card challenged you most when learning tarot?',
      'what-card-challenged-you-most-when-learning-tarot',
      'Which card took the longest to understand in practice, and what changed your relationship with it? This can be about a card meaning, a pattern in readings, or a moment when the card finally became clearer.'
    ),
    (
      development_section,
      author_uuid,
      'How do you distinguish intuition from memorized meanings?',
      'how-do-you-distinguish-intuition-from-memorized-meanings',
      'Many readers move between learned meanings and intuitive impressions. What helps you tell the difference between repeating a meaning from memory and receiving something alive from the reading?'
    ),
    (
      development_section,
      author_uuid,
      'What habit most improved your confidence as a reader?',
      'what-habit-most-improved-your-confidence-as-a-reader',
      'Confidence often grows through small, repeated practices. What habit helped you trust your reading process more: journaling, reading aloud, reviewing past spreads, studying one card deeply, or something else?'
    )
  on conflict (slug) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
