alter table public.community_posts
drop constraint if exists community_posts_post_type_check;

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
    'reading_dilemma',
    'symbolism_imagery',
    'question_framing'
  )
);
