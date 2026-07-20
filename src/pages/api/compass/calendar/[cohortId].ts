import type { APIRoute } from "astro";
import { getCompassCohortById } from "../../../../data/training/compass-cohorts";
import { buildCompassCohortIcsById } from "../../../../lib/compass/calendar";

export const prerender = false;

/** Cohort-level calendar download. No personal data in the URL or file. */
export const GET: APIRoute = async ({ params }) => {
  const raw = params.cohortId ?? "";
  const cohortId = raw.replace(/\.ics$/i, "");
  const cohort = getCompassCohortById(cohortId);
  if (!cohort) {
    return new Response("Cohort not found.", { status: 404, headers: { "content-type": "text/plain" } });
  }

  const ics = buildCompassCohortIcsById(cohortId);
  if (!ics) {
    return new Response("Unable to build calendar.", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }

  return new Response(ics, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="compass-${cohortId}.ics"`,
      "cache-control": "public, max-age=3600",
    },
  });
};
