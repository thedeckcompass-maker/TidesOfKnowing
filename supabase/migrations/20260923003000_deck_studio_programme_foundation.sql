create table if not exists public.studio_programme_modules (
  week_number smallint primary key check (week_number between 1 and 12),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  outcome text not null check (char_length(outcome) between 10 and 1000),
  completion_condition text not null check (char_length(completion_condition) between 10 and 1000),
  safely_unfinished text not null check (char_length(safely_unfinished) between 10 and 1000),
  production_risk text not null check (char_length(production_risk) between 10 and 1000),
  personal_guidance text not null check (char_length(personal_guidance) between 10 and 1000),
  independent_guidance text not null check (char_length(independent_guidance) between 10 and 1000),
  commercial_guidance text not null check (char_length(commercial_guidance) between 10 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.studio_programme_modules (
  week_number, slug, title, outcome, completion_condition, safely_unfinished,
  production_risk, personal_guidance, independent_guidance, commercial_guidance
) values
  (1, 'purpose-audience-promise', 'Deck purpose, audience and promise',
    'Define why the deck needs to exist, who it is for and the practical or reflective promise it makes.',
    'A working purpose, intended reader and one-sentence promise are recorded in the project.',
    'The final title, sales language and visual identity can remain open.',
    'A vague promise makes later card, guidebook and artwork decisions difficult to test.',
    'Name the person or occasion the deck serves and what a complete private edition should enable.',
    'Describe the reader, use case and benefit clearly enough to guide a small-run publication decision.',
    'State the audience problem, distinctive promise and evidence a public campaign will need.'),
  (2, 'deck-architecture', 'Oracle, tarot or hybrid architecture',
    'Choose the governing deck form and define how familiar structures and original elements work together.',
    'The deck type, planned size and governing structural rule are recorded.',
    'Individual card titles and final family names can remain provisional.',
    'An unclear architecture creates duplication, gaps and inconsistent reader expectations.',
    'Choose the simplest structure that makes the deck meaningful and usable for its intended recipient.',
    'Confirm that the structure is legible to buyers without forcing the work into an unsuitable convention.',
    'Explain the architecture in language that campaign readers, reviewers and collaborators can understand.'),
  (3, 'families-sequence-logic', 'Card families, sequence and internal logic',
    'Map the whole deck into families or sequences and make the internal progression visible.',
    'Every planned card has a place, family or explicit unassigned status in the whole-deck view.',
    'Card wording, numbering labels and the final print order may still change.',
    'Hidden gaps or overcrowded families become expensive after artwork and guidebook production begin.',
    'Use only the families needed to make the personal or gift edition coherent.',
    'Test whether the sequence is understandable to someone encountering the deck for the first time.',
    'Identify how the structure supports the campaign story, demonstration spreads and audience trust.'),
  (4, 'repeatable-card-framework', 'Repeatable card-writing framework',
    'Create a dependable card template that supports consistency without flattening individual cards.',
    'The project has a repeatable set of required and optional writing fields and at least one completed trial card.',
    'Advanced research, production and correspondence fields may remain empty until they are relevant.',
    'Writing cards without a shared framework increases omissions and later editorial rework.',
    'Keep the template light enough that completing the deck remains enjoyable and realistic.',
    'Include the minimum material a reader needs for independent use of the published deck.',
    'Include the interpretive, evidence and production fields required for editorial and campaign scrutiny.'),
  (5, 'voice-symbolism-depth', 'Voice, meaning, symbolism and interpretive depth',
    'Establish a recognisable voice and a disciplined method for turning symbols into usable meaning.',
    'Representative cards demonstrate a consistent voice, symbolic logic and level of interpretive depth.',
    'Polished final prose and complete cross-card comparison can wait until the first full draft exists.',
    'Inconsistent voice or unsupported symbolism weakens reader confidence and whole-deck coherence.',
    'Prioritise clarity, resonance and the relationship between image and meaning.',
    'Test the language with likely readers and remove assumptions that require private creator knowledge.',
    'Document the distinctive interpretive method so it can be explained credibly in public materials.'),
  (6, 'research-ethics-integrity', 'Research, attribution, ethics and cultural integrity',
    'Separate sources, quotations, permissions, cultural context, private notes and unresolved questions.',
    'Material claims and borrowed knowledge have traceable sources, permissions status or an explicit unresolved flag.',
    'Perfect citation formatting can wait, but source identity and permission risk cannot.',
    'Untraceable or culturally unsafe material can force late removal, damage trust or prevent publication.',
    'Record enough evidence to preserve integrity even when the deck will remain private.',
    'Resolve rights and attribution questions before committing to print or public distribution.',
    'Create a defensible evidence trail suitable for collaborators, reviewers, funders and public scrutiny.'),
  (7, 'artwork-rights', 'Artwork system, briefs and image rights',
    'Define the visual system, prepare usable briefs and record ownership and licensing status.',
    'A representative brief states subject, symbolism, composition, exclusions, format and rights status.',
    'Final artwork, packaging and every card-specific brief can remain incomplete.',
    'Unclear briefs and rights assumptions cause inconsistent images, budget overruns and publication delays.',
    'Choose a manageable visual method and record who owns every image used in the finished deck.',
    'Confirm print suitability, licensing scope and a repeatable handoff for the full artwork set.',
    'Make the visual system, disclosure position and rights evidence clear enough for public funding materials.'),
  (8, 'editing-testing-coherence', 'Editing, testing and deck coherence',
    'Test whether individual cards work and whether the deck behaves as one intentional system.',
    'A representative test identifies repetitions, gaps, confusing instructions and required revisions.',
    'Not every sentence or card needs final copy-editing before structural findings are resolved.',
    'Polishing too early can preserve structural faults and multiply correction costs.',
    'Test the deck with the people who will actually use or receive it.',
    'Use readers outside the project to test clarity, usability and guidebook sufficiency.',
    'Record credible testing evidence and resolve issues that could undermine campaign confidence.'),
  (9, 'guidebook-architecture', 'Digital and physical guidebook architecture',
    'Turn card material into an ordered guidebook with appropriate front matter, instructions and closing content.',
    'The guidebook has an agreed section order, card relationships and a clear reading journey.',
    'Final typography, page count and print-ready layout can remain open.',
    'Late guidebook planning exposes missing content and can change manufacturing specifications.',
    'Choose a guidebook format proportionate to the private edition and the way it will be used.',
    'Confirm that the manuscript can support the intended print or digital edition.',
    'Estimate the guidebook scope early enough to support quotations, rewards and campaign schedules.'),
  (10, 'manufacturing-prototype', 'Manufacturing specifications and prototype preparation',
    'Translate the creative system into measurable card, box, booklet and file requirements.',
    'A production record identifies intended components, dimensions, quantities and prototype questions.',
    'The supplier and final materials can remain undecided while specifications are tested.',
    'Requesting quotations without stable specifications produces misleading prices and avoidable revisions.',
    'Select an achievable small-batch or handmade method and test one complete physical example.',
    'Prepare comparable specifications for suppliers and verify the minimum viable production run.',
    'Prototype the edition that campaign promises will depend on and record supplier assumptions.'),
  (11, 'costing-pricing-fulfilment', 'Costing, pricing, fulfilment and funding goal',
    'Build a realistic unit-cost and fulfilment model suited to the chosen publication pathway.',
    'Known costs, allowances, price logic and the next unresolved financial variable are recorded.',
    'Exact international rates and final margins may remain provisional until supplier quotes are current.',
    'Underestimated packaging, tax, fees or fulfilment can turn a completed deck into an unaffordable project.',
    'Set a personal budget ceiling and choose a quantity that does not create unwanted inventory.',
    'Test price against total landed cost, sales channel fees and a realistic small-run quantity.',
    'Use evidenced costs, contingency and fulfilment assumptions to calculate a defensible funding goal.'),
  (12, 'campaign-publication-launch', 'Campaign story, publication assets and launch plan',
    'Assemble the project story, evidence, assets and next actions required for the chosen release.',
    'The project has a pathway-appropriate publication checklist, story outline, asset register and launch decision.',
    'Long-term promotion, stretch goals and later editions can remain outside the first release.',
    'Launching without a bounded promise, usable evidence and operational plan transfers hidden risk to supporters.',
    'Document the finished deck and the meaning of the project for its intended private audience.',
    'Prepare the metadata, product information, distribution choices and release assets needed for publication.',
    'Connect the campaign promise to prototypes, costs, fulfilment evidence and an achievable communications plan.')
on conflict (week_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  outcome = excluded.outcome,
  completion_condition = excluded.completion_condition,
  safely_unfinished = excluded.safely_unfinished,
  production_risk = excluded.production_risk,
  personal_guidance = excluded.personal_guidance,
  independent_guidance = excluded.independent_guidance,
  commercial_guidance = excluded.commercial_guidance,
  updated_at = now();

create table if not exists public.studio_programme_enrolments (
  project_id uuid primary key references public.studio_projects(id) on delete cascade,
  starts_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_programme_progress (
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  week_number smallint not null references public.studio_programme_modules(week_number) on delete restrict,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'complete')),
  current_task text not null default '' check (char_length(current_task) <= 2000),
  notes text not null default '' check (char_length(notes) <= 10000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, week_number)
);

create index if not exists studio_programme_progress_project_status_idx
  on public.studio_programme_progress(project_id, status, week_number);

create or replace function public.studio_start_programme(target_project_id uuid)
returns public.studio_programme_enrolments
language plpgsql
security definer
set search_path = public
as $$
declare
  enrolment public.studio_programme_enrolments;
begin
  if not public.studio_owns_project(target_project_id) or not public.studio_has_write_access() then
    raise exception 'Studio programme access denied';
  end if;

  insert into public.studio_programme_enrolments (project_id, starts_on)
  values (target_project_id, current_date)
  on conflict (project_id) do nothing;

  select * into enrolment from public.studio_programme_enrolments where project_id = target_project_id;
  return enrolment;
end;
$$;

revoke all on function public.studio_start_programme(uuid) from public;
grant execute on function public.studio_start_programme(uuid) to authenticated;

create or replace function public.studio_validate_programme_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  programme_start date;
begin
  select starts_on into programme_start
  from public.studio_programme_enrolments
  where project_id = new.project_id;

  if programme_start is null then
    raise exception 'Start the programme before recording progress';
  end if;

  if current_date < programme_start + ((new.week_number - 1) * 7) then
    raise exception 'This programme module is not available yet';
  end if;

  if new.status = 'complete' then
    new.completed_at = coalesce(new.completed_at, now());
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists studio_programme_progress_guard on public.studio_programme_progress;
create trigger studio_programme_progress_guard
before insert or update on public.studio_programme_progress
for each row execute function public.studio_validate_programme_progress();

drop trigger if exists studio_programme_progress_set_updated_at on public.studio_programme_progress;
create trigger studio_programme_progress_set_updated_at
before update on public.studio_programme_progress
for each row execute function public.set_updated_at();

alter table public.studio_programme_modules enable row level security;
alter table public.studio_programme_enrolments enable row level security;
alter table public.studio_programme_progress enable row level security;

drop policy if exists "Studio members can read programme modules" on public.studio_programme_modules;
create policy "Studio members can read programme modules"
on public.studio_programme_modules for select
using (public.studio_has_read_access());

drop policy if exists "Creators can read own programme enrolment" on public.studio_programme_enrolments;
create policy "Creators can read own programme enrolment"
on public.studio_programme_enrolments for select
using (public.studio_owns_project(project_id) and public.studio_has_read_access());

drop policy if exists "Creators can read own programme progress" on public.studio_programme_progress;
create policy "Creators can read own programme progress"
on public.studio_programme_progress for select
using (public.studio_owns_project(project_id) and public.studio_has_read_access());

drop policy if exists "Creators can insert own programme progress" on public.studio_programme_progress;
create policy "Creators can insert own programme progress"
on public.studio_programme_progress for insert
with check (public.studio_owns_project(project_id) and public.studio_has_write_access());

drop policy if exists "Creators can update own programme progress" on public.studio_programme_progress;
create policy "Creators can update own programme progress"
on public.studio_programme_progress for update
using (public.studio_owns_project(project_id) and public.studio_has_write_access())
with check (public.studio_owns_project(project_id) and public.studio_has_write_access());

comment on table public.studio_programme_modules is 'The governed twelve-week Deck Creator Studio pathway with pathway-specific translation.';
comment on table public.studio_programme_enrolments is 'Immutable per-project start date used to calculate weekly module availability.';
comment on table public.studio_programme_progress is 'Creator-owned tasks, notes and completion state for available programme modules.';
