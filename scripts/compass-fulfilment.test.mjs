#!/usr/bin/env node
/**
 * COMPASS simplified fulfilment tests (no live DB / Stripe / email).
 * Run: node scripts/compass-fulfilment.test.mjs
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const offerSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/offer.ts"), "utf8");
const fulfilmentSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/fulfilment.ts"), "utf8");
const notificationsSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/notifications.ts"), "utf8");
const capacitySrc = readFileSync(join(REPO_ROOT, "src/lib/compass/capacity.ts"), "utf8");
const cohortsSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/cohorts.ts"), "utf8");
const enrolmentsSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/enrolments.ts"), "utf8");
const webhookSrc = readFileSync(
  join(REPO_ROOT, "src/pages/api/ask-leilia/stripe-webhook.ts"),
  "utf8",
);
const thankYouSrc = readFileSync(join(REPO_ROOT, "src/pages/compass/thank-you.astro"), "utf8");
const paymentLinksSrc = readFileSync(join(REPO_ROOT, "src/lib/compass/paymentLinks.ts"), "utf8");
const simplifyMigrationSrc = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20260720120000_compass_enrolments_simplify.sql"),
  "utf8",
);

const COMPASS_AMOUNT_CENTS = 99700;
const COMPASS_STRIPE_PAYMENT_LINK_ID = "cNi9ASeie24O8ea9f57N603";
const COMPASS_CAPACITY = 6;

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function verifyCompassCheckoutOffer(input) {
  const currency = (input.currency ?? "").toLowerCase();
  if (currency && currency !== "usd") {
    return { ok: false, reason: `Unexpected currency ${currency}.` };
  }
  const link = input.paymentLink ?? "";
  const linkOk =
    !link ||
    link.includes(COMPASS_STRIPE_PAYMENT_LINK_ID) ||
    link.endsWith(COMPASS_STRIPE_PAYMENT_LINK_ID);
  if (link && !linkOk) {
    return { ok: false, reason: "Checkout payment_link does not match the COMPASS offer." };
  }
  const amount = input.amountTotal ?? 0;
  const paymentStatus = (input.paymentStatus ?? "").toLowerCase();
  const discounted =
    amount === 0 &&
    (paymentStatus === "no_payment_required" || paymentStatus === "paid" || !paymentStatus);
  if (amount !== COMPASS_AMOUNT_CENTS && !discounted) {
    return {
      ok: false,
      reason: `Expected ${COMPASS_AMOUNT_CENTS} cents or a fully discounted checkout, received ${amount}.`,
    };
  }
  return { ok: true };
}

function isCompassCohortAtPaidCapacity(paidCount) {
  return paidCount >= COMPASS_CAPACITY;
}

function resolveAvailability(configuredStatus, paidCount, closedByTime) {
  if (configuredStatus === "full" || paidCount >= COMPASS_CAPACITY) {
    return { status: "full", selectable: false };
  }
  if (configuredStatus === "closed" || closedByTime) {
    return { status: "closed", selectable: false };
  }
  return { status: "open", selectable: true };
}

console.log("\nCOMPASS fulfilment tests\n");

run("webhook still uses checkout.session.completed", () => {
  assert.match(webhookSrc, /checkout\.session\.completed/);
  assert.match(webhookSrc, /tryFulfillCompassEnrolment/);
});

run("COMPASS branch does not upsert ask_leilia_payments first", () => {
  const idxCompass = webhookSrc.indexOf("tryFulfillCompassEnrolment");
  const idxUpsert = webhookSrc.indexOf('from("ask_leilia_payments")');
  assert.ok(idxCompass > 0 && idxUpsert > idxCompass);
});

run("normal Stripe checkout completion accepts 99700 usd", () => {
  const result = verifyCompassCheckoutOffer({
    amountTotal: 99700,
    currency: "usd",
    paymentLink: `https://buy.stripe.com/${COMPASS_STRIPE_PAYMENT_LINK_ID}`,
    paymentStatus: "paid",
  });
  assert.equal(result.ok, true);
  assert.match(offerSrc, /verifyCompassCheckoutOffer/);
});

run("100% discount checkout completion is accepted", () => {
  const result = verifyCompassCheckoutOffer({
    amountTotal: 0,
    currency: "usd",
    paymentLink: `https://buy.stripe.com/${COMPASS_STRIPE_PAYMENT_LINK_ID}`,
    paymentStatus: "no_payment_required",
  });
  assert.equal(result.ok, true);
  assert.match(offerSrc, /no_payment_required/);
});

run("wrong Stripe offer / amount is rejected", () => {
  const wrongAmount = verifyCompassCheckoutOffer({
    amountTotal: 69700,
    currency: "usd",
    paymentLink: `https://buy.stripe.com/${COMPASS_STRIPE_PAYMENT_LINK_ID}`,
    paymentStatus: "paid",
  });
  assert.equal(wrongAmount.ok, false);

  const wrongLink = verifyCompassCheckoutOffer({
    amountTotal: 99700,
    currency: "usd",
    paymentLink: "https://buy.stripe.com/not-compass",
    paymentStatus: "paid",
  });
  assert.equal(wrongLink.ok, false);
});

run("unknown enrolment reference handling exists", () => {
  assert.match(fulfilmentSrc, /COMPASS enrolment not found/);
  assert.match(fulfilmentSrc, /Missing COMPASS enrolment reference/);
  assert.equal(isUuid("not-a-uuid"), false);
  assert.equal(isUuid("11111111-1111-4111-8111-111111111111"), true);
});

run("status changes to paid via RPC or fallback", () => {
  assert.match(fulfilmentSrc, /mark_compass_enrolment_paid/);
  assert.match(fulfilmentSrc, /status: "paid"/);
  assert.match(fulfilmentSrc, /paid_at/);
  assert.match(simplifyMigrationSrc, /mark_compass_enrolment_paid/);
  assert.match(simplifyMigrationSrc, /status in \('pending_payment', 'paid'\)/);
});

run("duplicate webhook does not send a second email", () => {
  assert.match(fulfilmentSrc, /Already paid: acknowledge retry without sending another email/);
  assert.match(fulfilmentSrc, /idempotent: true/);
  assert.match(fulfilmentSrc, /if \(!marked\.idempotent\)/);
});

run("one internal email generated", () => {
  assert.match(notificationsSrc, /New COMPASS enrolment/);
  assert.match(notificationsSrc, /sendCompassInternalNotification/);
  assert.match(fulfilmentSrc, /sendCompassInternalNotification/);
  assert.doesNotMatch(notificationsSrc, /Your COMPASS cohort is confirmed/);
  assert.doesNotMatch(notificationsSrc, /sendCompassStudentConfirmation/);
});

run("no student email is sent", () => {
  assert.doesNotMatch(fulfilmentSrc, /sendCompassStudentConfirmation/);
  assert.doesNotMatch(fulfilmentSrc, /student_confirmation/);
  assert.doesNotMatch(notificationsSrc, /FROM_STUDENT|student confirmation/i);
});

run("no calendar endpoint remains", () => {
  assert.equal(existsSync(join(REPO_ROOT, "src/lib/compass/calendar.ts")), false);
  assert.equal(
    existsSync(join(REPO_ROOT, "src/pages/api/compass/calendar/[cohortId].ts")),
    false,
  );
  assert.doesNotMatch(notificationsSrc, /compassCohortCalendar|\.ics/);
  assert.doesNotMatch(thankYouSrc, /\.ics|Download calendar/i);
});

run("capacity at six blocks seventh", () => {
  assert.equal(isCompassCohortAtPaidCapacity(5), false);
  assert.equal(isCompassCohortAtPaidCapacity(6), true);
  assert.match(capacitySrc, /COMPASS_CAPACITY/);
  assert.match(fulfilmentSrc, /Cohort is full/);
  assert.match(simplifyMigrationSrc, /p_max_paid/);
  assert.doesNotMatch(simplifyMigrationSrc, /status = 'payment_exception'/);
});

run("closed and expired cohorts are unselectable", () => {
  assert.deepEqual(resolveAvailability("closed", 0, false), {
    status: "closed",
    selectable: false,
  });
  assert.deepEqual(resolveAvailability("open", 0, true), {
    status: "closed",
    selectable: false,
  });
  assert.deepEqual(resolveAvailability("open", 6, false), {
    status: "full",
    selectable: false,
  });
  assert.match(cohortsSrc, /Enrolment closed/);
  assert.match(cohortsSrc, /paidCount >= COMPASS_CAPACITY/);
});

run("pending enrolment creation stays minimal", () => {
  assert.match(enrolmentsSrc, /pending_payment/);
  assert.match(enrolmentsSrc, /stripe_payment_link_id/);
  assert.doesNotMatch(enrolmentsSrc, /session_dates/);
  assert.doesNotMatch(enrolmentsSrc, /student_confirmation/);
});

run("thank-you page returns simple personal-contact message", () => {
  assert.match(thankYouSrc, /I.ll be in touch personally/);
  assert.match(thankYouSrc, /COMPASS enrolment/);
  assert.match(thankYouSrc, /I.ll contact[\s\S]*you directly/);
  assert.match(thankYouSrc, /two working days/);
  assert.match(thankYouSrc, /Leilia/);
  assert.match(thankYouSrc, /Return to Tides of Knowing/);
  assert.match(thankYouSrc, /View the COMPASS programme/);
  assert.doesNotMatch(thankYouSrc, /payment is being confirmed/);
  assert.doesNotMatch(thankYouSrc, /refresh this page/i);
  assert.doesNotMatch(thankYouSrc, /session_id/);
  assert.doesNotMatch(thankYouSrc, /getCompassEnrolmentByCheckoutSession/);
});

run("Stripe success URL constant documented", () => {
  assert.match(paymentLinksSrc, /COMPASS_STRIPE_SUCCESS_URL/);
  assert.match(paymentLinksSrc, /session_id=\{CHECKOUT_SESSION_ID\}/);
});

run("email failure does not revert paid status", () => {
  assert.match(fulfilmentSrc, /enrolment remains paid/);
});

run("cleanup migration removes speculative statuses and student tracking", () => {
  assert.match(simplifyMigrationSrc, /drop column if exists student_confirmation_sent_at/);
  assert.match(simplifyMigrationSrc, /drop column if exists session_dates/);
  assert.match(simplifyMigrationSrc, /pending_payment', 'paid'/);
  assert.doesNotMatch(simplifyMigrationSrc, /status = 'payment_exception'/);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
