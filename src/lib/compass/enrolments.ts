import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMPASS_OFFER_ID,
  COMPASS_PRICE_USD,
  COMPASS_SOURCE_PAGE,
  COMPASS_TIMEZONE,
} from "../../data/training/compass-cohorts";
import { assertCompassCohortHasSeat } from "./capacity";
import type { CompassCohortView } from "./cohorts";

export type CompassEnrolmentInsert = {
  firstName: string;
  lastName: string;
  email: string;
  cohort: CompassCohortView;
};

export async function insertCompassPendingEnrolment(
  service: SupabaseClient,
  input: CompassEnrolmentInsert,
): Promise<{ id: string } | { error: string }> {
  const seat = await assertCompassCohortHasSeat(service, input.cohort.id);
  if (!seat.ok) {
    return { error: seat.error };
  }

  const { data, error } = await service
    .from("compass_enrolments")
    .insert({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      cohort_id: input.cohort.id,
      cohort_label: input.cohort.label,
      start_date: input.cohort.startDate,
      session_dates: [...input.cohort.sessionDates],
      timezone: COMPASS_TIMEZONE,
      price_usd: COMPASS_PRICE_USD,
      offer_id: COMPASS_OFFER_ID,
      stripe_payment_link_id: "cNi9ASeie24O8ea9f57N603",
      source_page: COMPASS_SOURCE_PAGE,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("COMPASS pending enrolment insert failed:", error);
    return { error: "Unable to save your enrolment right now. Please try again shortly." };
  }

  return { id: (data as { id: string }).id };
}

export async function getCompassEnrolmentByCheckoutSession(
  service: SupabaseClient,
  checkoutSessionId: string,
) {
  const { data, error } = await service
    .from("compass_enrolments")
    .select(
      "id, first_name, last_name, email, cohort_id, cohort_label, start_date, session_dates, timezone, status, student_confirmation_sent_at, paid_at",
    )
    .eq("stripe_checkout_session_id", checkoutSessionId)
    .maybeSingle();

  if (error) {
    console.error("COMPASS enrolment lookup by checkout session failed:", error);
    return null;
  }

  return data;
}
