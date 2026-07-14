-- Correct Ask Leilia seed testimonial attribution and reading types.
-- Idempotent: updates fixed review IDs only; preserves dates, names, ratings,
-- approval, featured, consent, verification, and IDs.

update public.ask_leilia_reviews
set
  reading_type = 'one-question',
  body_original = 'Leilia helped me step back from my own emotional bias and see the situation more clearly. Her interpretation was thoughtful, balanced and genuinely useful, especially because I tend to view my own readings more negatively.',
  body_public = 'Leilia helped me step back from my own emotional bias and see the situation more clearly. Her interpretation was thoughtful, balanced and genuinely useful, especially because I tend to view my own readings more negatively.',
  updated_at = now()
where id = 'c5e1f8a0-0708-4111-8b25-00a5c1e11001'
  and (
    reading_type is distinct from 'one-question'
    or body_original is distinct from 'Leilia helped me step back from my own emotional bias and see the situation more clearly. Her interpretation was thoughtful, balanced and genuinely useful, especially because I tend to view my own readings more negatively.'
    or body_public is distinct from 'Leilia helped me step back from my own emotional bias and see the situation more clearly. Her interpretation was thoughtful, balanced and genuinely useful, especially because I tend to view my own readings more negatively.'
  );

update public.ask_leilia_reviews
set
  reading_type = 'one-question',
  body_original = 'I loved Leilia’s interpretation. It was insightful, thoughtful and gave me a fresh way to understand both the cards and the situation.',
  body_public = 'I loved Leilia’s interpretation. It was insightful, thoughtful and gave me a fresh way to understand both the cards and the situation.',
  updated_at = now()
where id = 'c5e1f8a0-0710-4111-8b25-00a5c1e11002'
  and (
    reading_type is distinct from 'one-question'
    or body_original is distinct from 'I loved Leilia’s interpretation. It was insightful, thoughtful and gave me a fresh way to understand both the cards and the situation.'
    or body_public is distinct from 'I loved Leilia’s interpretation. It was insightful, thoughtful and gave me a fresh way to understand both the cards and the situation.'
  );

update public.ask_leilia_reviews
set
  reading_type = 'one-question',
  body_original = 'This was such a beautiful interpretation. It made sense immediately, and I especially appreciated the way Leilia explained how she was reading the cards, not just the conclusion she reached.',
  body_public = 'This was such a beautiful interpretation. It made sense immediately, and I especially appreciated the way Leilia explained how she was reading the cards, not just the conclusion she reached.',
  updated_at = now()
where id = 'c5e1f8a0-0712-4111-8b25-00a5c1e11003'
  and (
    reading_type is distinct from 'one-question'
    or body_original is distinct from 'This was such a beautiful interpretation. It made sense immediately, and I especially appreciated the way Leilia explained how she was reading the cards, not just the conclusion she reached.'
    or body_public is distinct from 'This was such a beautiful interpretation. It made sense immediately, and I especially appreciated the way Leilia explained how she was reading the cards, not just the conclusion she reached.'
  );
