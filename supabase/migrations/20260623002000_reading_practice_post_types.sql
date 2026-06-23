alter table public.community_posts
add column if not exists post_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_posts_post_type_check'
  ) then
    alter table public.community_posts
    add constraint community_posts_post_type_check
    check (
      post_type is null
      or post_type in (
        'practice_reading',
        'spread_feedback',
        'card_combination',
        'clarifier_question',
        'repeating_cards',
        'reading_dilemma'
      )
    );
  end if;
end $$;

create index if not exists community_posts_post_type_created_idx
on public.community_posts(post_type, created_at desc)
where post_type is not null;
