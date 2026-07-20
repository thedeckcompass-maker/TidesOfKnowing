import type { SupabaseClient } from "@supabase/supabase-js";
import { COMPASS_CAPACITY } from "../../data/training/compass-cohorts";

export async function countCompassPaidEnrolments(
  service: SupabaseClient,
  cohortId: string,
): Promise<number> {
  const { count, error } = await service
    .from("compass_enrolments")
    .select("id", { count: "exact", head: true })
    .eq("cohort_id", cohortId)
    .eq("status", "paid");

  if (error) {
    console.error("COMPASS paid enrolment count failed:", error);
    throw new Error("Unable to verify cohort capacity.");
  }

  return count ?? 0;
}

export async function getCompassPaidCountsByCohort(
  service: SupabaseClient,
): Promise<Map<string, number>> {
  const { data, error } = await service
    .from("compass_enrolments")
    .select("cohort_id")
    .eq("status", "paid");

  if (error) {
    console.error("COMPASS paid enrolment map failed:", error);
    return new Map();
  }

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const id = (row as { cohort_id: string }).cohort_id;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

export function isCompassCohortAtPaidCapacity(paidCount: number): boolean {
  return paidCount >= COMPASS_CAPACITY;
}

export async function assertCompassCohortHasSeat(
  service: SupabaseClient,
  cohortId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const paid = await countCompassPaidEnrolments(service, cohortId);
    if (isCompassCohortAtPaidCapacity(paid)) {
      return {
        ok: false,
        error: "That cohort is full. Please choose another available cohort.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to verify cohort capacity right now." };
  }
}
