-- Explicit API role privileges for Studio. RLS remains the authority for each row.
-- Some deployments do not inherit Supabase's default table grants for new migrations.
revoke all on public.studio_projects, public.studio_card_families, public.studio_cards,
  public.studio_card_versions, public.studio_guidebook_sections, public.studio_guidebook_versions,
  public.studio_import_records, public.studio_journal_entries, public.studio_journal_photos,
  public.studio_journal_excerpts, public.studio_pulse_requests, public.studio_support_requests,
  public.studio_programme_modules, public.studio_programme_enrolments, public.studio_programme_progress,
  public.studio_artist_profiles, public.studio_artist_contacts, public.studio_artist_shortlists,
  public.studio_artist_introductions, public.studio_community_shares, public.studio_checkout_reservations,
  public.studio_entitlements, public.studio_onboarding, public.studio_plan_capacity,
  public.studio_billing_events, public.studio_entitlement_audit
from anon;

grant select, insert, update, delete on public.studio_projects, public.studio_card_families,
  public.studio_cards, public.studio_guidebook_sections, public.studio_journal_entries,
  public.studio_journal_photos, public.studio_journal_excerpts,
  public.studio_artist_shortlists, public.studio_artist_introductions to authenticated;
grant select on public.studio_card_versions, public.studio_guidebook_versions,
  public.studio_import_records, public.studio_programme_modules, public.studio_programme_enrolments,
  public.studio_community_shares, public.studio_checkout_reservations, public.studio_entitlements,
  public.studio_plan_capacity, public.studio_billing_events, public.studio_entitlement_audit
to authenticated;
grant select, insert, update on public.studio_pulse_requests, public.studio_support_requests,
  public.studio_programme_progress, public.studio_onboarding, public.studio_artist_profiles,
  public.studio_artist_contacts to authenticated;
