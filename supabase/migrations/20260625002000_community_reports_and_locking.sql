create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  reply_id uuid references public.community_replies(id) on delete cascade,
  reason text not null check (
    reason in (
      'spam',
      'disrespectful_or_harmful',
      'privacy_concern',
      'off_topic',
      'duplicate',
      'other'
    )
  ),
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_reports_single_target_check check (
    (post_id is not null and reply_id is null)
    or (post_id is null and reply_id is not null)
  )
);

alter table public.moderation_actions
add column if not exists report_id uuid references public.community_reports(id) on delete set null;

alter table public.moderation_actions
drop constraint if exists moderation_actions_action_check;

alter table public.moderation_actions
add constraint moderation_actions_action_check
check (
  action in (
    'pin_post',
    'unpin_post',
    'hide_post',
    'delete_post',
    'restore_post',
    'lock_post',
    'unlock_post',
    'hide_reply',
    'delete_reply',
    'restore_reply',
    'restrict_user',
    'block_user',
    'restore_user',
    'dismiss_report'
  )
);

create index if not exists community_reports_status_created_idx
on public.community_reports(status, created_at asc);

create index if not exists community_reports_post_idx
on public.community_reports(post_id)
where post_id is not null;

create index if not exists community_reports_reply_idx
on public.community_reports(reply_id)
where reply_id is not null;

create index if not exists moderation_actions_report_idx
on public.moderation_actions(report_id)
where report_id is not null;

drop trigger if exists community_reports_set_updated_at on public.community_reports;
create trigger community_reports_set_updated_at
before update on public.community_reports
for each row execute function public.set_updated_at();

alter table public.community_reports enable row level security;

drop policy if exists "Active members can create reports" on public.community_reports;
create policy "Active members can create reports"
on public.community_reports for insert
with check (auth.uid() = reporter_user_id and public.is_active_member());

drop policy if exists "Members can read own reports" on public.community_reports;
create policy "Members can read own reports"
on public.community_reports for select
using (auth.uid() = reporter_user_id);

drop policy if exists "Admins can manage reports" on public.community_reports;
create policy "Admins can manage reports"
on public.community_reports for all
using (public.is_admin())
with check (public.is_admin());
