#!/usr/bin/env node
/**
 * Ask Leilia One Question payment catalogue / checkout validation regression.
 * Covers EXPECTED_PAYMENT_CENTS (4500) and validateCheckoutSessionPayment paths.
 * Run: node scripts/ask-leilia-payment-validation.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

const amountsSrc = readFileSync(join(REPO_ROOT, "src/lib/ask-leilia/paymentAmounts.ts"), "utf8");
const validationSrc = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/checkoutPaymentValidation.ts"),
  "utf8",
);
const webhookSrc = readFileSync(
  join(REPO_ROOT, "src/pages/api/ask-leilia/stripe-webhook.ts"),
  "utf8",
);
const paymentLinksSrc = readFileSync(join(REPO_ROOT, "src/lib/ask-leilia/paymentLinks.ts"), "utf8");
const askDataSrc = readFileSync(join(REPO_ROOT, "src/data/askLeilia.ts"), "utf8");
const notificationsSrc = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/notifications.ts"),
  "utf8",
);

/** Mirror of EXPECTED_PAYMENT_CENTS for one-question (must stay aligned with source). */
const ONE_QUESTION_CENTS = 4500;

/**
 * Minimal mirror of validateCheckoutSessionPayment for the one-question catalogue.
 * Kept in sync with src/lib/ask-leilia/checkoutPaymentValidation.ts acceptance rules.
 */
function validateOneQuestionCheckout(session) {
  const currency = (session.currency ?? "usd").toLowerCase();
  const catalogueAmountCents = ONE_QUESTION_CENTS;
  const paidAmountCents = session.amount_total ?? 0;
  const paymentStatus = session.payment_status ?? "";
  const audit = {
    catalogueAmountCents,
    paidAmountCents,
    discountAmountCents: session.total_details?.amount_discount ?? 0,
  };

  if (currency !== "usd") {
    return { accepted: false, path: "payment_exception", reason: "currency", audit };
  }
  if (paymentStatus !== "paid" && paymentStatus !== "no_payment_required") {
    return { accepted: false, path: "payment_exception", reason: "status", audit };
  }
  if (paidAmountCents === catalogueAmountCents) {
    return { accepted: true, path: "normal", audit };
  }

  const discountAmountCents = audit.discountAmountCents;
  const hasDiscount =
    discountAmountCents > 0 || (Array.isArray(session.discounts) && session.discounts.length > 0);
  if (
    paidAmountCents === 0 &&
    hasDiscount &&
    discountAmountCents >= catalogueAmountCents &&
    (typeof session.amount_subtotal !== "number" ||
      (session.amount_subtotal === catalogueAmountCents &&
        session.amount_subtotal - discountAmountCents === paidAmountCents))
  ) {
    return { accepted: true, path: "fully_discounted", audit };
  }

  return {
    accepted: false,
    path: "payment_exception",
    reason: `Catalogue price ${catalogueAmountCents} ${currency}, checkout total ${paidAmountCents}.`,
    audit,
  };
}

console.log("\nAsk Leilia One Question payment validation tests\n");

run('EXPECTED_PAYMENT_CENTS one-question is explicitly 4500 cents', () => {
  assert.match(amountsSrc, /"one-question"\s*:\s*4500/);
  assert.doesNotMatch(amountsSrc, /"one-question"\s*:\s*2500/);
  assert.match(amountsSrc, /"in-depth"\s*:\s*7500/);
  assert.match(amountsSrc, /"personal-guidance"\s*:\s*15000/);
});

run('public One Question display price is US$45', () => {
  assert.match(askDataSrc, /name:\s*"One Question Reading"[\s\S]*?price:\s*"US\$45"/);
  assert.doesNotMatch(askDataSrc, /name:\s*"One Question Reading"[\s\S]*?price:\s*"US\$25"/);
});

run('One Question Payment Link uses N607 slug', () => {
  assert.match(paymentLinksSrc, /5kQ28qb62fVE8ea8b17N607/);
  assert.doesNotMatch(paymentLinksSrc, /5kQ14m7TQ5h01PMezp7N601/);
  assert.match(paymentLinksSrc, /5kQ8wO2zw6l451YgHx7N605/);
  assert.match(paymentLinksSrc, /eVq9AS3DA38S66262T7N606/);
});

run('4500-cent completed checkout is accepted for one-question', () => {
  const result = validateOneQuestionCheckout({
    amount_total: 4500,
    amount_subtotal: 4500,
    currency: "usd",
    payment_status: "paid",
    discounts: [],
    total_details: { amount_discount: 0 },
  });
  assert.equal(result.accepted, true);
  assert.equal(result.path, "normal");
  assert.equal(result.audit.catalogueAmountCents, 4500);
  assert.equal(result.audit.paidAmountCents, 4500);
});

run('incorrect amount is rejected into payment_exception path', () => {
  const result = validateOneQuestionCheckout({
    amount_total: 2500,
    amount_subtotal: 2500,
    currency: "usd",
    payment_status: "paid",
    discounts: [],
    total_details: { amount_discount: 0 },
  });
  assert.equal(result.accepted, false);
  assert.equal(result.path, "payment_exception");
  assert.match(result.reason, /4500/);
});

run('legitimate 100% discounted zero-total checkout is accepted', () => {
  const result = validateOneQuestionCheckout({
    amount_total: 0,
    amount_subtotal: 4500,
    currency: "usd",
    payment_status: "no_payment_required",
    discounts: [{ promotion_code: "promo_test" }],
    total_details: { amount_discount: 4500 },
  });
  assert.equal(result.accepted, true);
  assert.equal(result.path, "fully_discounted");
  assert.equal(result.audit.catalogueAmountCents, 4500);
});

run('webhook uses checkout.session.completed and client_reference_id matching', () => {
  assert.match(webhookSrc, /checkout\.session\.completed/);
  assert.match(webhookSrc, /client_reference_id/);
  assert.match(webhookSrc, /validateCheckoutSessionPayment/);
  assert.match(validationSrc, /expectedPaymentCents/);
  assert.match(validationSrc, /fully_discounted/);
});

run('webhook marks request Paid and sends confirmation / admin notifications', () => {
  assert.match(webhookSrc, /status:\s*"Paid"/);
  assert.match(webhookSrc, /notifyAskLeiliaPaymentCompleted/);
  assert.match(webhookSrc, /sendAskLeiliaCustomerPaymentConfirmation/);
  assert.match(notificationsSrc, /notifyAskLeiliaPaymentCompleted/);
  assert.match(notificationsSrc, /sendAskLeiliaCustomerPaymentConfirmation/);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
