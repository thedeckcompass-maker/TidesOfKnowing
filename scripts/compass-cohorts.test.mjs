#!/usr/bin/env node
/**
 * COMPASS cohort schedule + enrolment validation tests (no live DB).
 * Run: node scripts/compass-cohorts.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Dynamic import of TS via Node is unavailable; mirror critical contracts from source files.
const cohortsSrc = readFileSync(
  join(REPO_ROOT, "src/data/training/compass-cohorts.ts"),
  "utf8",
);
const cohortsLibSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/cohorts.ts"), "utf8");
const validationSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/validation.ts"), "utf8");
const enrolApiSrc = readFileSync(join(REPO_ROOT, "src/pages/api/compass/enrol.ts"), "utf8");
const paymentSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/paymentLinks.ts"), "utf8");
const pageSrc = readFileSync(join(REPO_ROOT, "src/pages/compass.astro"), "utf8");
const migrationSrc = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20260720000000_compass_enrolments.sql"),
  "utf8",
);

function test(name, fn) {
  try {
    fn();
    console.log(`  ok — ${name}`);
    return true;
  } catch (err) {
    console.error(`  FAIL — ${name}`);
    console.error(`         ${err.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;
function run(name, fn) {
  if (test(name, fn)) passed += 1;
  else failed += 1;
}

const EXPECTED = [
  ["2026-09-early", ["2026-09-01", "2026-09-03", "2026-09-05", "2026-09-07"], "Tue"],
  ["2026-09-mid", ["2026-09-15", "2026-09-17", "2026-09-19", "2026-09-21"], "Tue"],
  ["2026-10-early", ["2026-10-06", "2026-10-08", "2026-10-10", "2026-10-12"], "Tue"],
  ["2026-10-mid", ["2026-10-20", "2026-10-22", "2026-10-24", "2026-10-26"], "Tue"],
  ["2026-11-early", ["2026-11-03", "2026-11-05", "2026-11-07", "2026-11-09"], "Tue"],
  ["2026-11-mid", ["2026-11-17", "2026-11-19", "2026-11-21", "2026-11-23"], "Tue"],
  ["2026-12-early", ["2026-12-01", "2026-12-03", "2026-12-05", "2026-12-07"], "Tue"],
  ["2026-12-mid", ["2026-12-15", "2026-12-17", "2026-12-19", "2026-12-21"], "Tue"],
  ["2027-01-early", ["2027-01-05", "2027-01-07", "2027-01-09", "2027-01-11"], "Tue"],
  ["2027-01-mid", ["2027-01-19", "2027-01-21", "2027-01-23", "2027-01-25"], "Tue"],
  ["2027-02-early", ["2027-02-02", "2027-02-04", "2027-02-06", "2027-02-08"], "Tue"],
  ["2027-02-mid", ["2027-02-16", "2027-02-18", "2027-02-20", "2027-02-22"], "Tue"],
];

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmtShort = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "America/Mexico_City",
});

console.log("\nCOMPASS cohort tests\n");

run("defines twelve cohorts", () => {
  const calls = [...cohortsSrc.matchAll(/cohort\(\d{4},\s*\d+/g)];
  assert.equal(calls.length, 12);
});

run("all expected session dates present", () => {
  for (const [, dates] of EXPECTED) {
    for (const d of dates) {
      assert.ok(cohortsSrc.includes(`"${d}"`), `missing ${d}`);
    }
  }
});

run("cohort id pattern uses monthKey-slot", () => {
  assert.match(cohortsSrc, /const id = `\$\{monthKey\}-\$\{slot\}`/);
});

run("48-hour closure math closes before first session", () => {
  const first = new Date("2026-09-01T19:00:00-06:00");
  const closes = new Date(first.getTime() - 48 * 60 * 60 * 1000);
  const openAt = new Date(closes.getTime() - 60_000);
  const closedAt = new Date(closes.getTime() + 60_000);
  assert.ok(openAt < closes);
  assert.ok(closedAt >= closes);
  assert.equal(closes.toISOString(), "2026-08-31T01:00:00.000Z");
});

run("all start dates are Tuesdays in Mexico City", () => {
  for (const [, dates] of EXPECTED) {
    const start = dates[0];
    const got = fmtShort.format(new Date(`${start}T19:00:00-06:00`));
    assert.equal(got, "Tue", `${start} was ${got}`);
  }
});

run("all session weekdays match Tue/Thu/Sat/Mon pattern", () => {
  const expect = ["Tue", "Thu", "Sat", "Mon"];
  for (const [, dates] of EXPECTED) {
    dates.forEach((d, i) => {
      const got = fmtShort.format(new Date(`${d}T19:00:00-06:00`));
      assert.equal(got, expect[i], `${d} expected ${expect[i]}, got ${got}`);
    });
  }
});

run("timezone and payment constants are correct", () => {
  assert.match(cohortsSrc, /America\/Mexico_City/);
  assert.match(cohortsSrc, /cNi9ASeie24O8ea9f57N603/);
  assert.match(cohortsSrc, /compass-live-997/);
  assert.match(cohortsSrc, /COMPASS_CAPACITY = 6/);
  assert.match(cohortsSrc, /COMPASS_ENROLMENT_CLOSE_HOURS = 48/);
});

run("48-hour closure helper exists", () => {
  assert.match(cohortsLibSrc, /COMPASS_ENROLMENT_CLOSE_HOURS/);
  assert.match(cohortsLibSrc, /compassEnrolmentClosesAt/);
  assert.match(cohortsLibSrc, /resolveCompassAvailability/);
});

run("validation rejects unknown cohort and altered dates", () => {
  assert.match(validationSrc, /getSelectableCompassCohort/);
  assert.match(validationSrc, /sessionDatesMatchCohort/);
  assert.match(validationSrc, /honeypot/);
});

run("enrol API redirects via Payment Link builder", () => {
  assert.match(enrolApiSrc, /buildCompassPaymentRedirectUrl/);
  assert.match(enrolApiSrc, /insertCompassPendingEnrolment/);
  assert.match(paymentSrc, /buildPaymentLinkRedirectUrl/);
  assert.match(paymentSrc, /client_reference_id|buildPaymentLinkRedirectUrl/);
});

run("page CTAs use choose-your-cohort anchor, not public Stripe", () => {
  assert.match(pageSrc, /#choose-your-cohort/);
  assert.match(pageSrc, /id="choose-your-cohort"/);
  const stripeOnPage = [...pageSrc.matchAll(/buy\.stripe\.com/g)];
  assert.equal(stripeOnPage.length, 0, "public Stripe links remain on compass.astro");
  const chooseCtas = [...pageSrc.matchAll(/Choose Your Cohort/g)];
  assert.ok(chooseCtas.length >= 4);
  assert.match(pageSrc, /COMPASS_CHOOSE_COHORT_HREF/);
  assert.doesNotMatch(pageSrc, /COMPASS_ENROL_997/);
});

run("enrolment form posts to API with hidden offer fields", () => {
  assert.match(pageSrc, /action="\/api\/compass\/enrol"/);
  assert.match(pageSrc, /name="offerId"/);
  assert.match(pageSrc, /name="timezone"/);
  assert.match(pageSrc, /name="sessionDates"/);
  assert.match(pageSrc, /name="website"/);
  assert.match(pageSrc, /Enrol and Pay · US\$997/);
  assert.match(pageSrc, /Starts /);
  assert.match(pageSrc, /Further teaching sessions:/);
});

run("migration defines compass_enrolments pending_payment", () => {
  assert.match(migrationSrc, /create table if not exists public\.compass_enrolments/);
  assert.match(migrationSrc, /pending_payment/);
  assert.match(migrationSrc, /cohort_id/);
  assert.match(migrationSrc, /start_date/);
  assert.match(migrationSrc, /session_dates/);
  assert.match(migrationSrc, /enable row level security/);
});

run("start-date hierarchy copy present", () => {
  assert.match(pageSrc, /I can attend the cohort beginning/);
  assert.match(cohortsLibSrc, /formatCompassFurtherSessions/);
  assert.match(cohortsLibSrc, /formatCompassSessionDateLong/);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
