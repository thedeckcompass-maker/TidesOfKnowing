-- Reading Library — Phase 1: authorised historical sample readings.
--
-- Additive and idempotent. Extends reading_library_publications so a
-- publication may originate from either a genuine Delivered Ask Leilia request
-- (existing behaviour, unchanged) or an authorised historical sample reading
-- completed outside the current order system.
--
-- No historical migration is edited. Existing rows default to
-- source_type = 'ask_leilia_request'. Consent and private-storage fields are
-- never part of the public projection (enforced in application queries) and are
-- unreachable by anon/authenticated (grants revoked below; reads go through the
-- SSR service client with an explicit safe projection, mirroring
-- ask_leilia_reviews).
--
-- Rollback (manual):
--   alter table public.reading_library_publications
--     drop column if exists source_type,
--     drop column if exists sample_client_display_name,
--     drop column if exists sample_display_name_public,
--     drop column if exists sample_consent_confirmed_at,
--     drop column if exists sample_consent_scope,
--     drop column if exists sample_consent_note,
--     drop column if exists sample_pdf_storage_path;

alter table public.reading_library_publications
  add column if not exists source_type text not null default 'ask_leilia_request';

alter table public.reading_library_publications
  add column if not exists sample_client_display_name text;

alter table public.reading_library_publications
  add column if not exists sample_display_name_public boolean not null default false;

alter table public.reading_library_publications
  add column if not exists sample_consent_confirmed_at timestamptz;

alter table public.reading_library_publications
  add column if not exists sample_consent_scope text;

alter table public.reading_library_publications
  add column if not exists sample_consent_note text;

alter table public.reading_library_publications
  add column if not exists sample_pdf_storage_path text;

-- Defensive backfill (the NOT NULL DEFAULT already applies to existing rows).
update public.reading_library_publications
set source_type = 'ask_leilia_request'
where source_type is null;

-- Source-type domain.
alter table public.reading_library_publications
  drop constraint if exists reading_library_publications_source_type_check;
alter table public.reading_library_publications
  add constraint reading_library_publications_source_type_check
  check (source_type in ('ask_leilia_request', 'authorised_sample'));

-- Request-linked publications must carry an Ask Leilia request id (the existing
-- unique FK column). Delivered-request validation remains enforced at the API
-- layer; this only guarantees the linkage cannot be null for this source type.
alter table public.reading_library_publications
  drop constraint if exists reading_library_publications_request_requires_id;
alter table public.reading_library_publications
  add constraint reading_library_publications_request_requires_id
  check (source_type <> 'ask_leilia_request' or ask_leilia_request_id is not null);

-- Authorised samples must NOT reference an Ask Leilia request (no fake orders).
alter table public.reading_library_publications
  drop constraint if exists reading_library_publications_sample_no_request;
alter table public.reading_library_publications
  add constraint reading_library_publications_sample_no_request
  check (source_type <> 'authorised_sample' or ask_leilia_request_id is null);

-- A PUBLISHED authorised sample must have a private sample PDF path and a
-- confirmed-consent timestamp. Drafts (is_published = false) may omit them.
alter table public.reading_library_publications
  drop constraint if exists reading_library_publications_sample_publish_ready;
alter table public.reading_library_publications
  add constraint reading_library_publications_sample_publish_ready
  check (
    not (is_published and source_type = 'authorised_sample')
    or (sample_pdf_storage_path is not null and sample_consent_confirmed_at is not null)
  );

-- If a sample's client name may be shown publicly, the name must be present.
alter table public.reading_library_publications
  drop constraint if exists reading_library_publications_sample_name_present;
alter table public.reading_library_publications
  add constraint reading_library_publications_sample_name_present
  check (sample_display_name_public = false or sample_client_display_name is not null);

create index if not exists reading_library_publications_source_type_idx
  on public.reading_library_publications (source_type);

-- Security hardening. Route all reads through the SSR service client with an
-- explicit safe projection. Remove direct anon/authenticated table access so
-- consent notes and private storage paths are never reachable via the public
-- API — even for published rows. The public site and admin already use the
-- service client, so this is behaviour-preserving for the app and strictly
-- stronger for security.
drop policy if exists "Anyone can read published library readings" on public.reading_library_publications;
revoke all on table public.reading_library_publications from anon, authenticated;
grant select, insert, update, delete on table public.reading_library_publications to service_role;
