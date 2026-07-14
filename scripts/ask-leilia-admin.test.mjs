#!/usr/bin/env node
/**
 * Ask Leilia fulfilment dashboard — unit tests (no live DB).
 * Run: npm run test:ask-leilia-admin
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

const STRIPE_SUCCESS = new Set(["paid", "complete", "succeeded", "success"]);

function isAskLeiliaStripePaymentVerified(request) {
  if (request.status === "Pending Payment" || request.status === "Payment Exception") {
    return false;
  }
  const stripeStatus = request.payment?.payment_status?.trim().toLowerCase() ?? "";
  if (stripeStatus && STRIPE_SUCCESS.has(stripeStatus)) return true;
  if (request.payment_id && ["Paid", "In Progress", "Delivered"].includes(request.status)) {
    return true;
  }
  if (
    request.reading_type === "complimentary" &&
    ["Paid", "In Progress", "Delivered"].includes(request.status)
  ) {
    return true;
  }
  if (
    request.manually_marked_paid &&
    !request.payment_id &&
    request.reading_type !== "complimentary"
  ) {
    return false;
  }
  return ["Paid", "In Progress", "Delivered"].includes(request.status);
}

function isAskLeiliaManualPaymentActive(request) {
  return Boolean(request.manually_marked_paid) && !request.manual_payment_reversed_at;
}

function isAskLeiliaEffectivelyPaid(request) {
  return isAskLeiliaStripePaymentVerified(request) || isAskLeiliaManualPaymentActive(request);
}

function deriveAskLeiliaFulfilmentStatus(request) {
  if (request.archived_at) return "archived";
  if (request.status === "Delivered") return "delivered";
  if (request.delivery_pdf_path) return "ready_to_send";
  if (request.status === "In Progress") return "in_progress";
  return "new";
}

function resolveReviewWorkflowStatus(request) {
  if (request.linked_review_id || request.review_status === "provided") return "provided";
  if (request.review_status === "requested") return "requested";
  return "not_requested";
}

function matchesView(request, view) {
  const fulfilment = deriveAskLeiliaFulfilmentStatus(request);
  const review = resolveReviewWorkflowStatus(request);
  const effectivelyPaid = isAskLeiliaEffectivelyPaid(request);
  switch (view) {
    case "active":
      return !request.archived_at;
    case "unpaid":
      return !request.archived_at && !effectivelyPaid;
    case "paid":
      return !request.archived_at && effectivelyPaid;
    case "new":
      return !request.archived_at && fulfilment === "new";
    case "in_progress":
      return !request.archived_at && fulfilment === "in_progress";
    case "ready_to_send":
      return !request.archived_at && fulfilment === "ready_to_send";
    case "delivered":
      return !request.archived_at && fulfilment === "delivered";
    case "review_outstanding":
      return (
        !request.archived_at &&
        fulfilment === "delivered" &&
        (review === "not_requested" || review === "requested")
      );
    case "review_provided":
      return !request.archived_at && review === "provided";
    case "archived":
      return Boolean(request.archived_at);
    default:
      return true;
  }
}

function validateStartReading(input) {
  if (input.archivedAt) return { ok: false, error: "Restore this reading before starting work." };
  if (!input.effectivelyPaid) {
    return { ok: false, error: "Mark this reading as paid before starting fulfilment." };
  }
  if (input.status === "Delivered") {
    return { ok: false, error: "This reading has already been delivered." };
  }
  return { ok: true, value: "In Progress" };
}

function validateSystemDelivery(input) {
  if (input.archivedAt) return { ok: false, error: "Restore this reading before sending." };
  if (input.status === "Delivered") {
    return { ok: false, error: "This reading has already been delivered. Use Resend instead." };
  }
  if (!input.effectivelyPaid) {
    return { ok: false, error: "Mark this reading as paid before sending." };
  }
  if (!input.hasDeliveryPdf) {
    return { ok: false, error: "Upload a completed reading PDF before sending." };
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "A valid client email address is required to send the reading." };
  }
  return { ok: true, value: true };
}

function validateManualDelivery(input) {
  if (input.archivedAt) {
    return { ok: false, error: "Restore this reading before marking it delivered." };
  }
  if (input.status === "Delivered") {
    return { ok: false, error: "This reading has already been delivered." };
  }
  if (!input.effectivelyPaid) {
    return { ok: false, error: "Mark this reading as paid before marking delivery." };
  }
  return { ok: true, value: true };
}

function validateResendDelivery(input) {
  if (input.status !== "Delivered") {
    return { ok: false, error: "Only delivered readings can be resent." };
  }
  if (!input.hasDeliveryPdf) {
    return { ok: false, error: "A completed reading PDF is required to resend." };
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "A valid client email address is required to resend." };
  }
  return { ok: true, value: true };
}

function validateRemoveDeliveryPdf(input) {
  if (!input.hasDeliveryPdf) {
    return { ok: false, error: "There is no completed reading PDF to remove." };
  }
  if (input.status === "Delivered") {
    return {
      ok: false,
      error:
        "Completed PDFs cannot be removed after delivery. Upload a replacement if you need a corrected file.",
    };
  }
  return { ok: true, value: true };
}

function validateRequestReview(input) {
  if (input.status !== "Delivered") {
    return { ok: false, error: "Request a review only after the reading has been delivered." };
  }
  if (input.linkedReviewId || input.reviewStatus === "provided") {
    return { ok: false, error: "A review has already been provided for this reading." };
  }
  return { ok: true, value: true };
}

function parseAskLeiliaAdminSort(value) {
  return value === "oldest" ? "oldest" : "newest";
}

function parseAskLeiliaAdminView(value) {
  const allowed = [
    "active",
    "unpaid",
    "paid",
    "new",
    "in_progress",
    "ready_to_send",
    "delivered",
    "review_outstanding",
    "review_provided",
    "archived",
  ];
  return allowed.includes(value) ? value : "active";
}

function compareAskLeiliaAdminRequests(a, b, sort) {
  const aTime = Date.parse(a.created_at);
  const bTime = Date.parse(b.created_at);
  const aValid = Number.isFinite(aTime);
  const bValid = Number.isFinite(bTime);
  if (aValid && bValid && aTime !== bTime) {
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  }
  if (aValid !== bValid) {
    if (sort === "oldest") return aValid ? -1 : 1;
    return aValid ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function sortAskLeiliaAdminRequests(requests, sort) {
  return [...requests].sort((a, b) => compareAskLeiliaAdminRequests(a, b, sort));
}

function parseAdminReturnPath(value) {
  if (typeof value !== "string" || !value.startsWith("/ask-leilia/admin/")) {
    return "/ask-leilia/admin/";
  }
  try {
    const url = new URL(value, "https://www.tidesofknowing.com");
    if (url.pathname !== "/ask-leilia/admin" && url.pathname !== "/ask-leilia/admin/") {
      return "/ask-leilia/admin/";
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return "/ask-leilia/admin/";
  }
}

function formatSubmissionDisplayUtc(iso) {
  if (!iso || !String(iso).trim()) {
    return {
      dateText: "Submission time unavailable",
      timeText: "",
      title: "Submission time unavailable",
      unavailable: true,
    };
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return {
      dateText: "Submission time unavailable",
      timeText: "",
      title: "Submission time unavailable",
      unavailable: true,
    };
  }
  return { dateText: "ok", timeText: "ok", title: "ok", unavailable: false };
}

function baseRow(overrides = {}) {
  return {
    id: "x",
    created_at: "2026-07-10T12:00:00.000Z",
    archived_at: null,
    status: "Paid",
    payment_id: "pay_1",
    reading_type: "one_question",
    delivery_pdf_path: null,
    review_status: "not_requested",
    linked_review_id: null,
    manually_marked_paid: false,
    manual_payment_method: null,
    manual_payment_reversed_at: null,
    payment: { payment_status: "paid", amount: 4400, currency: "nzd", stripe_payment_intent: "pi_1" },
    ...overrides,
  };
}

const sample = [
  baseRow({ id: "a", created_at: "2026-07-14T12:00:00.000Z", status: "Paid" }),
  baseRow({
    id: "b",
    created_at: "2026-07-13T12:00:00.000Z",
    archived_at: "2026-07-13T15:00:00.000Z",
    status: "Paid",
  }),
  baseRow({
    id: "c",
    created_at: "2026-07-12T12:00:00.000Z",
    status: "Pending Payment",
    payment_id: null,
    payment: null,
  }),
  baseRow({
    id: "d",
    created_at: "2026-07-11T12:00:00.000Z",
    status: "In Progress",
    delivery_pdf_path: "deliveries/d/x.pdf",
  }),
  baseRow({
    id: "e",
    created_at: "2026-07-10T12:00:00.000Z",
    status: "Delivered",
    delivery_pdf_path: "deliveries/e/x.pdf",
    review_status: "requested",
  }),
  baseRow({
    id: "f",
    created_at: "2026-07-09T12:00:00.000Z",
    status: "Delivered",
    delivery_pdf_path: "deliveries/f/x.pdf",
    review_status: "provided",
    linked_review_id: "rev-1",
  }),
  baseRow({
    id: "g",
    created_at: "2026-07-08T12:00:00.000Z",
    status: "Payment Exception",
    payment_id: "pay_fail",
    payment: {
      payment_status: "unpaid",
      amount: 0,
      currency: "nzd",
      stripe_payment_intent: "pi_fail",
    },
  }),
];

const adminPage = readFileSync(join(REPO_ROOT, "src/pages/ask-leilia/admin.astro"), "utf8");
const apiSource = readFileSync(
  join(REPO_ROOT, "src/pages/api/ask-leilia/requests/[id].ts"),
  "utf8",
);
const migration = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20260714250000_ask_leilia_fulfilment_dashboard.sql"),
  "utf8",
);
const queriesSource = readFileSync(join(REPO_ROOT, "src/lib/ask-leilia/queries.ts"), "utf8");
const fulfilmentSource = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/fulfilment.ts"),
  "utf8",
);
const deliverySource = readFileSync(join(REPO_ROOT, "src/lib/ask-leilia/delivery.ts"), "utf8");
const notificationsSource = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/notifications.ts"),
  "utf8",
);
const reviewsQuerySource = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/reviews/queries.ts"),
  "utf8",
);
const checkoutSource = readFileSync(
  join(REPO_ROOT, "src/pages/api/ask-leilia/checkout.ts"),
  "utf8",
);
const submitSource = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/submitRequest.ts"),
  "utf8",
);
const webhookSource = readFileSync(
  join(REPO_ROOT, "src/pages/api/ask-leilia/stripe-webhook.ts"),
  "utf8",
);
const validationSource = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/validation.ts"),
  "utf8",
);

run("newest-first ordering", () => {
  const sorted = sortAskLeiliaAdminRequests(sample, "newest");
  assert.equal(sorted[0].id, "a");
});

run("active view includes paid and unpaid non-archived requests", () => {
  const active = sample.filter((row) => matchesView(row, "active")).map((row) => row.id);
  assert.deepEqual(active, ["a", "c", "d", "e", "f", "g"]);
});

run("unpaid filter is correct", () => {
  const unpaid = sample.filter((row) => matchesView(row, "unpaid")).map((row) => row.id);
  assert.deepEqual(unpaid, ["c", "g"]);
});

run("paid filter is correct", () => {
  const paid = sample.filter((row) => matchesView(row, "paid")).map((row) => row.id);
  assert.deepEqual(paid, ["a", "d", "e", "f"]);
});

run("archived readings excluded from active", () => {
  assert.equal(matchesView(sample[1], "active"), false);
  assert.equal(matchesView(sample[1], "archived"), true);
});

run("questionnaire preserved before Stripe checkout", () => {
  assert.match(submitSource, /status:\s*"Pending Payment"/);
  assert.match(checkoutSource, /insertAskLeiliaPendingRequest/);
  assert.match(checkoutSource, /Response\.redirect\(paymentUrl/);
  const insertIdx = checkoutSource.indexOf("insertAskLeiliaPendingRequest");
  const redirectIdx = checkoutSource.indexOf("Response.redirect(paymentUrl");
  assert.ok(insertIdx > -1 && redirectIdx > insertIdx);
});

run("failed and incomplete Stripe questionnaires appear in dashboard model", () => {
  assert.equal(isAskLeiliaEffectivelyPaid(sample.find((r) => r.id === "c")), false);
  assert.equal(isAskLeiliaEffectivelyPaid(sample.find((r) => r.id === "g")), false);
  assert.equal(matchesView(sample.find((r) => r.id === "c"), "active"), true);
  assert.equal(matchesView(sample.find((r) => r.id === "g"), "active"), true);
  assert.doesNotMatch(queriesSource, /applyActionableFilter/);
  assert.doesNotMatch(queriesSource, /\.in\("status", ASK_LEILIA_ACTIONABLE_STATUSES\)/);
});

run("webhook retries do not duplicate a request", () => {
  assert.match(webhookSource, /onConflict:\s*"stripe_payment_intent"/);
  assert.match(webhookSource, /wasAlreadyPaid/);
  assert.doesNotMatch(webhookSource, /\.from\("ask_leilia_requests"\)[\s\S]{0,80}\.insert\(/);
});

run("verified Stripe success displays Paid", () => {
  assert.equal(isAskLeiliaEffectivelyPaid(baseRow({ status: "Paid" })), true);
});

run("failed Stripe payment displays Unpaid", () => {
  assert.equal(
    isAskLeiliaEffectivelyPaid(
      baseRow({
        status: "Payment Exception",
        payment: { payment_status: "unpaid", amount: 0, currency: "nzd", stripe_payment_intent: "pi_x" },
      }),
    ),
    false,
  );
});

run("incomplete Stripe payment displays Unpaid", () => {
  assert.equal(
    isAskLeiliaEffectivelyPaid(
      baseRow({ status: "Pending Payment", payment_id: null, payment: null }),
    ),
    false,
  );
});

run("manual PayPal payment changes effective state to Paid", () => {
  const unpaid = baseRow({
    status: "Pending Payment",
    payment_id: null,
    payment: null,
    manually_marked_paid: true,
    manual_payment_method: "paypal",
  });
  assert.equal(isAskLeiliaStripePaymentVerified(unpaid), false);
  assert.equal(isAskLeiliaEffectivelyPaid(unpaid), true);
});

run("waived or complimentary changes effective state to Paid", () => {
  const waived = baseRow({
    status: "Pending Payment",
    payment_id: null,
    payment: null,
    manually_marked_paid: true,
    manual_payment_method: "waived_complimentary",
  });
  assert.equal(isAskLeiliaEffectivelyPaid(waived), true);
});

run("raw Stripe status is unchanged by manual payment model", () => {
  assert.match(apiSource, /actionRaw === "mark_as_paid"/);
  assert.match(apiSource, /manually_marked_paid: true/);
  const markBranch = apiSource.slice(
    apiSource.indexOf('if (actionRaw === "mark_as_paid")'),
    apiSource.indexOf('if (actionRaw === "reverse_manual_payment")'),
  );
  assert.doesNotMatch(markBranch, /ask_leilia_payments/);
  assert.doesNotMatch(markBranch, /payment_status:/);
  assert.doesNotMatch(markBranch, /status:\s*"Paid"/);
});

run("reversing manual override returns Unpaid when Stripe was not successful", () => {
  const before = baseRow({
    status: "Pending Payment",
    payment_id: null,
    payment: null,
    manually_marked_paid: true,
    manual_payment_method: "paypal",
  });
  assert.equal(isAskLeiliaEffectivelyPaid(before), true);
  const after = { ...before, manually_marked_paid: false, manual_payment_reversed_at: "2026-07-14T12:00:00.000Z" };
  assert.equal(isAskLeiliaEffectivelyPaid(after), false);
  assert.match(apiSource, /actionRaw === "reverse_manual_payment"/);
  assert.match(apiSource, /statusAfterManualPaymentReversal/);
});

run("reversing manual override cannot make successful Stripe request Unpaid", () => {
  const stripePaid = baseRow({
    status: "Paid",
    manually_marked_paid: true,
    manual_payment_method: "paypal",
  });
  assert.equal(isAskLeiliaStripePaymentVerified(stripePaid), true);
  const after = {
    ...stripePaid,
    manually_marked_paid: false,
    manual_payment_reversed_at: "2026-07-14T12:00:00.000Z",
  };
  assert.equal(isAskLeiliaStripePaymentVerified(after), true);
  assert.equal(isAskLeiliaEffectivelyPaid(after), true);
});

run("unpaid reading remains viewable and can save notes", () => {
  assert.equal(matchesView(sample.find((r) => r.id === "c"), "active"), true);
  assert.match(apiSource, /actionRaw === "save_notes"/);
  const notesBranch = apiSource.slice(
    apiSource.indexOf('if (actionRaw === "save_notes")'),
    apiSource.indexOf('if (actionRaw === "upload_pdf"'),
  );
  assert.doesNotMatch(notesBranch, /effectivelyPaid/);
});

run("unpaid reading cannot start or send fulfilment", () => {
  assert.equal(
    validateStartReading({
      status: "Pending Payment",
      archivedAt: null,
      effectivelyPaid: false,
    }).ok,
    false,
  );
  assert.equal(
    validateSystemDelivery({
      status: "Pending Payment",
      archivedAt: null,
      hasDeliveryPdf: true,
      email: "a@example.com",
      effectivelyPaid: false,
    }).ok,
    false,
  );
  assert.equal(
    validateManualDelivery({
      status: "Pending Payment",
      archivedAt: null,
      effectivelyPaid: false,
    }).ok,
    false,
  );
});

run("marking unpaid reading paid enables normal fulfilment", () => {
  assert.equal(
    validateStartReading({
      status: "Pending Payment",
      archivedAt: null,
      effectivelyPaid: true,
    }).ok,
    true,
  );
  assert.equal(
    validateSystemDelivery({
      status: "In Progress",
      archivedAt: null,
      hasDeliveryPdf: true,
      email: "a@example.com",
      effectivelyPaid: true,
    }).ok,
    true,
  );
});

run("paid workflow continues to pass existing fulfilment checks", () => {
  assert.equal(
    deriveAskLeiliaFulfilmentStatus({
      status: "In Progress",
      archived_at: null,
      delivery_pdf_path: "x.pdf",
    }),
    "ready_to_send",
  );
  assert.equal(
    validateSystemDelivery({
      status: "In Progress",
      archivedAt: null,
      hasDeliveryPdf: true,
      email: "a@example.com",
      effectivelyPaid: true,
    }).ok,
    true,
  );
});

run("ready_to_send derived from PDF without delivered status", () => {
  assert.equal(
    deriveAskLeiliaFulfilmentStatus({
      status: "In Progress",
      archived_at: null,
      delivery_pdf_path: "x.pdf",
    }),
    "ready_to_send",
  );
});

run("failed send leaves ready_to_send state model intact", () => {
  assert.match(apiSource, /delivery_sent_at: null/);
  assert.match(apiSource, /actionRaw === "send_delivery"/);
});

run("manual delivery accepted for effectively paid undelivered readings", () => {
  assert.equal(
    validateManualDelivery({ status: "In Progress", archivedAt: null, effectivelyPaid: true }).ok,
    true,
  );
  assert.match(apiSource, /manually_delivered: true/);
});

run("resend keeps delivered status and requires PDF", () => {
  assert.equal(
    validateResendDelivery({
      status: "Delivered",
      hasDeliveryPdf: true,
      email: "a@example.com",
    }).ok,
    true,
  );
});

run("archive and restore do not change status", () => {
  const archiveBranch = apiSource.slice(
    apiSource.indexOf('if (actionRaw === "archive" || actionRaw === "restore")'),
    apiSource.indexOf("const existing = await loadRequest"),
  );
  assert.doesNotMatch(archiveBranch, /\.update\(\{[\s\S]*status:/);
});

run("remove PDF blocked after delivery", () => {
  assert.equal(
    validateRemoveDeliveryPdf({ status: "Delivered", hasDeliveryPdf: true }).ok,
    false,
  );
});

run("review cannot be requested before delivery", () => {
  assert.equal(
    validateRequestReview({
      status: "In Progress",
      reviewStatus: "not_requested",
      linkedReviewId: null,
    }).ok,
    false,
  );
});

run("review status provided when linked review exists", () => {
  assert.equal(
    resolveReviewWorkflowStatus({
      review_status: "requested",
      linked_review_id: "abc",
    }),
    "provided",
  );
});

run("review outstanding and provided filters", () => {
  assert.deepEqual(
    sample.filter((row) => matchesView(row, "review_outstanding")).map((row) => row.id),
    ["e"],
  );
  assert.deepEqual(
    sample.filter((row) => matchesView(row, "review_provided")).map((row) => row.id),
    ["f"],
  );
});

run("dashboard shows compact payment column with accessible text", () => {
  assert.match(adminPage, />Payment</);
  assert.match(adminPage, /ask-admin-payment--paid/);
  assert.match(adminPage, /ask-admin-payment--unpaid/);
  assert.match(adminPage, /effectivePaymentLabel/);
  assert.doesNotMatch(adminPage, /REQUEST:\s*PAID/i);
});

run("mark as paid UI and methods present", () => {
  assert.match(adminPage, /Mark as paid/);
  assert.match(adminPage, /ASK_LEILIA_MANUAL_PAYMENT_METHODS\.map/);
  assert.match(adminPage, /Waived or complimentary|ASK_LEILIA_MANUAL_PAYMENT_METHOD_LABELS/);
  assert.match(adminPage, /Reverse manual payment/);
  assert.match(fulfilmentSource, /waived_complimentary/);
  assert.match(migration, /manually_marked_paid/);
  assert.match(migration, /manual_payment_method/);
  assert.match(validationSource, /validateMarkAsPaid/);
});

run("PDF component and MIME validation present", () => {
  assert.match(adminPage, /Upload completed reading PDF/);
  assert.match(deliverySource, /application\/pdf/);
});

run("review request email is separate from delivery email", () => {
  assert.match(notificationsSource, /sendAskLeiliaReviewRequest/);
  assert.match(apiSource, /actionRaw === "request_review"/);
  assert.match(reviewsQuerySource, /linked_review_id: reviewId/);
});

run("unauthorised access rejected", () => {
  assert.match(apiSource, /isAdminProfile\(locals\.profile\)/);
});

run("migration additive and does not invent historical paid outcomes", () => {
  assert.match(migration, /manually_marked_paid boolean not null default false/);
  assert.match(migration, /Do NOT invent manual payment/);
  assert.doesNotMatch(migration, /delete from public\.ask_leilia_requests/i);
});

run("keyboard accessible expand control", () => {
  assert.match(adminPage, /aria-expanded/);
  assert.match(adminPage, /ask-admin-expand/);
});

run("sort and view params validated", () => {
  assert.equal(parseAskLeiliaAdminSort("nope"), "newest");
  assert.equal(parseAskLeiliaAdminView("unpaid"), "unpaid");
  assert.equal(parseAskLeiliaAdminView("nope"), "active");
});

run("return path stays inside admin queue", () => {
  assert.equal(parseAdminReturnPath("/ask-leilia/admin/?view=unpaid"), "/ask-leilia/admin/?view=unpaid");
  assert.equal(parseAdminReturnPath("https://evil.example/"), "/ask-leilia/admin/");
});

run("missing timestamp fallback", () => {
  const unavailable = formatSubmissionDisplayUtc(null);
  assert.equal(unavailable.unavailable, true);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
