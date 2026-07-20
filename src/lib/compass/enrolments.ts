import type { SupabaseClient } from "@supabase/supabase-js";
import { assertCompassCohortHasSeat } from "./capacity";
import { COMPASS_STRIPE_PAYMENT_LINK_ID } from "./offer";
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
      stripe_payment_link_id: COMPASS_STRIPE_PAYMENT_LINK_ID,
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
