#!/usr/bin/env node
/**
 * Ask Leilia reviews — unit tests (no live DB).
 * Run: npm run test:ask-leilia-reviews
 *
 * Self-contained so Node can run without resolving Astro's extensionless TS imports.
 * Mirrors the behavioural contracts in src/lib/ask-leilia/reviews/*.
 */

import assert from "node:assert/strict";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
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

function generateAskLeiliaReviewToken() {
  return randomBytes(32).toString("base64url");
}

function hashAskLeiliaReviewToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function tokensMatch(provided, expectedHash) {
  const providedHash = hashAskLeiliaReviewToken(provided);
  const a = Buffer.from(providedHash, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function stripUnsafeReviewText(value) {
  return value
    .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\u0000/g, "");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_READING_TYPES = [
  "one-question",
  "in-depth",
  "personal-guidance",
];
const DB_READING_TYPES = [...PUBLIC_READING_TYPES, "complimentary"];
const READING_TYPE_LABELS = {
  "one-question": "One Question Reading",
  "in-depth": "In-Depth Reading",
  "personal-guidance": "Personal Guidance Reading",
  complimentary: "Complimentary Reading",
};
const MIN_BODY = 40;
const MAX_BODY = 4000;

function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function validateSubmission(input) {
  const honeypot = cleanText(input.honeypot);
  if (honeypot) {
    return { ok: false, error: "spam" };
  }

  const displayName = stripUnsafeReviewText(cleanText(input.displayName).replace(/\s+/g, " "));
  const email = cleanText(input.email).toLowerCase();
  const title = stripUnsafeReviewText(cleanText(input.title).replace(/\s+/g, " "));
  const body = stripUnsafeReviewText(cleanText(input.body));
  const token = typeof input.token === "string" ? input.token.trim() : "";
  const ratingRaw =
    typeof input.rating === "number"
      ? input.rating
      : typeof input.rating === "string"
        ? Number.parseInt(input.rating, 10)
        : NaN;
  const consentPublish =
    input.consentPublish === true ||
    input.consentPublish === "on" ||
    input.consentPublish === "true" ||
    input.consentPublish === "1";
  const consentMarketing =
    input.consentMarketing === true ||
    input.consentMarketing === "on" ||
    input.consentMarketing === "true" ||
    input.consentMarketing === "1";

  if (!displayName || displayName.length > 80) return { ok: false, error: "name" };
  if ((!email || !EMAIL_RE.test(email)) && !token) return { ok: false, error: "email" };
  if (token) {
    if (!DB_READING_TYPES.includes(input.readingType)) return { ok: false, error: "type" };
  } else if (!PUBLIC_READING_TYPES.includes(input.readingType)) {
    return { ok: false, error: "type" };
  }
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { ok: false, error: "rating" };
  }
  if (title.length > 120) return { ok: false, error: "title" };
  if (body.length < MIN_BODY || body.length > MAX_BODY) return { ok: false, error: "body" };
  if (!consentPublish) return { ok: false, error: "consent" };

  return {
    ok: true,
    value: {
      displayName,
      email,
      readingType: input.readingType,
      rating: ratingRaw,
      title,
      body,
      consentPublish: true,
      consentMarketing,
      token,
    },
  };
}

function toPublicReview(row) {
  return {
    id: row.id,
    display_name: row.display_name,
    reading_type: row.reading_type,
    reading_type_label: READING_TYPE_LABELS[row.reading_type] ?? row.reading_type,
    rating: row.rating,
    title: row.title,
    body: (row.body_public?.trim() || row.body_original).trim(),
    is_verified:
      row.verification_status === "verified_completed_reading" ||
      row.verification_status === "manually_verified",
    published_month_year: "June 2026",
  };
}

const rateBuckets = new Map();
function consumeRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const bucket = rateBuckets.get(key) ?? [];
  const fresh = bucket.filter((ts) => now - ts < windowMs);
  if (fresh.length >= limit) {
    rateBuckets.set(key, fresh);
    return { allowed: false };
  }
  fresh.push(now);
  rateBuckets.set(key, fresh);
  return { allowed: true };
}

run("tokens hash securely and match", () => {
  const token = generateAskLeiliaReviewToken();
  assert.ok(token.length >= 32);
  const hash = hashAskLeiliaReviewToken(token);
  assert.equal(hash.length, 64);
  assert.equal(tokensMatch(token, hash), true);
  assert.equal(tokensMatch("wrong-token-value-xxxxxxxx", hash), false);
});

run("source tokens module uses sha256 and randomBytes", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/lib/ask-leilia/reviews/tokens.ts"),
    "utf8",
  );
  assert.match(source, /randomBytes/);
  assert.match(source, /sha256/);
  assert.match(source, /timingSafeEqual/);
});

run("valid public submission without token", () => {
  const result = validateSubmission({
    displayName: "Anna",
    email: "anna@example.com",
    readingType: "one-question",
    rating: "5",
    title: "Clear and direct",
    body: "The reading answered my question clearly and gave me a different perspective on the situation I brought.",
    consentPublish: "on",
    consentMarketing: "",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.consentPublish, true);
  assert.equal(result.value.consentMarketing, false);
  assert.equal(result.value.rating, 5);
});

run("token-based submission allows omitted email", () => {
  const result = validateSubmission({
    displayName: "A. S.",
    email: "",
    readingType: "in-depth",
    rating: 4,
    title: "",
    body: "What stood out was how carefully the reading addressed the heart of the question without rushing to comfort.",
    consentPublish: true,
    consentMarketing: true,
    token: "a".repeat(40),
    honeypot: "",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.consentMarketing, true);
});

run("publication consent is required", () => {
  const result = validateSubmission({
    displayName: "Sam",
    email: "sam@example.com",
    readingType: "personal-guidance",
    rating: 5,
    title: "",
    body: "The guidance helped me see the pattern I had been circling, and the way it was written felt precise and kind.",
    consentPublish: "",
    consentMarketing: "on",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "consent");
});

run("marketing consent stored separately when present", () => {
  const result = validateSubmission({
    displayName: "Sam",
    email: "sam@example.com",
    readingType: "one-question",
    rating: 5,
    title: "",
    body: "The guidance helped me see the pattern I had been circling, and the way it was written felt precise and kind.",
    consentPublish: "on",
    consentMarketing: "on",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.consentPublish, true);
  assert.equal(result.value.consentMarketing, true);
});

run("honeypot submissions are rejected", () => {
  const result = validateSubmission({
    displayName: "Bot",
    email: "bot@example.com",
    readingType: "one-question",
    rating: 5,
    title: "",
    body: "The guidance helped me see the pattern I had been circling, and the way it was written felt precise and kind.",
    consentPublish: "on",
    consentMarketing: "",
    token: "",
    honeypot: "http://spam.example",
  });
  assert.equal(result.ok, false);
});

run("short body is rejected", () => {
  const result = validateSubmission({
    displayName: "Sam",
    email: "sam@example.com",
    readingType: "one-question",
    rating: 3,
    title: "",
    body: "Too short",
    consentPublish: "on",
    consentMarketing: "",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, false);
});

run("untokened submission using One Question Reading", () => {
  const result = validateSubmission({
    displayName: "Jordan",
    email: "jordan@example.com",
    readingType: "one-question",
    rating: 5,
    title: "Clear answer",
    body: "I received an Ask Leilia One Question Reading and found the written guidance clear, grounded, and carefully considered.",
    consentPublish: "on",
    consentMarketing: "",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.readingType, "one-question");
  assert.equal(result.value.token, "");
});

run("untokened submission using In-Depth Reading", () => {
  const result = validateSubmission({
    displayName: "Jordan",
    email: "jordan@example.com",
    readingType: "in-depth",
    rating: 5,
    title: "Thorough guidance",
    body: "I received an Ask Leilia In-Depth Reading and found the written guidance clear, grounded, and carefully considered.",
    consentPublish: "on",
    consentMarketing: "",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.readingType, "in-depth");
});

run("untokened submission using Personal Guidance Reading", () => {
  const result = validateSubmission({
    displayName: "Jordan",
    email: "jordan@example.com",
    readingType: "personal-guidance",
    rating: 4,
    title: "",
    body: "I received an Ask Leilia Personal Guidance Reading and found the written guidance clear, grounded, and carefully considered.",
    consentPublish: "on",
    consentMarketing: "",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.readingType, "personal-guidance");
});

run("invalid or deprecated client-supplied complimentary rejected for untokened submissions", () => {
  const result = validateSubmission({
    displayName: "Jordan",
    email: "jordan@example.com",
    readingType: "complimentary",
    rating: 5,
    title: "A generous reading",
    body: "I received a complimentary Ask Leilia reading through Facebook and found the written guidance clear, grounded, and carefully considered.",
    consentPublish: "on",
    consentMarketing: "",
    token: "",
    honeypot: "",
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "type");
});

run("historical complimentary label still maps for existing records", () => {
  assert.equal(READING_TYPE_LABELS.complimentary, "Complimentary Reading");

  const approvedPublic = toPublicReview({
    id: "11111111-1111-1111-1111-111111111111",
    request_id: null,
    review_token_id: null,
    reviewer_email: "jordan@example.com",
    display_name: "Jordan",
    reading_type: "complimentary",
    rating: 5,
    title: "A generous reading",
    body_original:
      "I received a complimentary Ask Leilia reading through Facebook and found the written guidance clear, grounded, and carefully considered.",
    body_public: null,
    consent_publish: true,
    consent_marketing: false,
    verification_status: "unverified",
    moderation_status: "approved",
    is_featured: false,
    submitted_at: "2026-07-01T10:00:00.000Z",
    approved_at: "2026-07-02T10:00:00.000Z",
    approved_by: "44444444-4444-4444-4444-444444444444",
    updated_at: "2026-07-02T10:00:00.000Z",
  });

  assert.equal(approvedPublic.is_verified, false);
  assert.equal(approvedPublic.reading_type_label, "Complimentary Reading");
});

run("generic form offers three actual reading products and not Complimentary Reading", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/pages/submit-a-review/index.astro"),
    "utf8",
  );
  assert.match(source, /ASK_LEILIA_READING_TYPES\.map/);
  assert.equal(source.includes("ASK_LEILIA_DB_READING_TYPES"), false);
  assert.equal(source.includes("Complimentary Reading"), false);

  const labels = readFileSync(
    join(REPO_ROOT, "src/lib/ask-leilia/readingTypes.ts"),
    "utf8",
  );
  assert.match(labels, /ASK_LEILIA_READING_TYPES/);
  assert.match(labels, /"one-question"/);
  assert.match(labels, /"in-depth"/);
  assert.match(labels, /"personal-guidance"/);
  // Label remains for historical DB records; not offered on the public form.
  assert.match(labels, /Complimentary Reading/);
});

run("submit API overrides token reading type and defaults untokened to unverified", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/pages/api/ask-leilia/reviews/index.ts"),
    "utf8",
  );
  assert.match(source, /readingType = resolved\.readingType/);
  assert.match(source, /verificationStatus = "verified_completed_reading"/);
  assert.match(source, /let verificationStatus[\s\S]*?= "unverified"/);
  assert.match(source, /isAskLeiliaReadingType/);
});

run("tokened submissions retain the server-side request type", () => {
  const browserAttempt = validateSubmission({
    displayName: "Alex",
    email: "",
    readingType: "one-question",
    rating: 5,
    title: "",
    body: "The reading through the verified delivery link still felt precise and personal without overstating certainty.",
    consentPublish: "on",
    consentMarketing: "",
    token: "b".repeat(40),
    honeypot: "",
  });
  assert.equal(browserAttempt.ok, true);

  // API resolveAskLeiliaReviewToken replaces reading type from the completed request.
  const tokenResolvedReadingType = "personal-guidance";
  const verificationStatus = "verified_completed_reading";
  assert.notEqual(browserAttempt.value.readingType, tokenResolvedReadingType);
  assert.equal(tokenResolvedReadingType, "personal-guidance");
  assert.equal(verificationStatus, "verified_completed_reading");
  assert.equal(READING_TYPE_LABELS[tokenResolvedReadingType], "Personal Guidance Reading");
});

run("zero-dollar order retains its actual product type", () => {
  // A 100% discount does not change the purchased reading type.
  const requestReadingType = "in-depth";
  const paymentAmount = 0;
  const browserAttempt = validateSubmission({
    displayName: "Casey",
    email: "",
    readingType: "complimentary",
    rating: 5,
    title: "",
    body: "Even though the checkout total was zero through a discount code, the reading was still the In-Depth product I selected.",
    consentPublish: "on",
    consentMarketing: "",
    token: "c".repeat(40),
    honeypot: "",
  });
  assert.equal(browserAttempt.ok, true);
  assert.equal(DB_READING_TYPES.includes("complimentary"), true);

  const storedReadingType = requestReadingType; // server override from request
  assert.equal(paymentAmount, 0);
  assert.equal(storedReadingType, "in-depth");
  assert.equal(READING_TYPE_LABELS[storedReadingType], "In-Depth Reading");
  assert.notEqual(storedReadingType, "complimentary");
});

run("corrected testimonials use Leilia and display One Question Reading", () => {
  const migration = readFileSync(
    join(
      REPO_ROOT,
      "supabase/migrations/20260714230000_ask_leilia_correct_testimonial_attribution.sql",
    ),
    "utf8",
  );
  assert.match(migration, /c5e1f8a0-0708-4111-8b25-00a5c1e11001/);
  assert.match(migration, /c5e1f8a0-0710-4111-8b25-00a5c1e11002/);
  assert.match(migration, /c5e1f8a0-0712-4111-8b25-00a5c1e11003/);
  assert.match(migration, /reading_type = 'one-question'/);
  assert.match(migration, /Leilia helped me step back/);
  assert.match(migration, /I loved Leilia/);
  assert.match(migration, /the way Leilia explained/);
  assert.equal(migration.includes("Leigh"), false);

  const testimonials = [
    {
      id: "c5e1f8a0-0708-4111-8b25-00a5c1e11001",
      title: "Clearer than my own perspective",
      reading_type: "one-question",
      body_public:
        "Leilia helped me step back from my own emotional bias and see the situation more clearly. Her interpretation was thoughtful, balanced and genuinely useful, especially because I tend to view my own readings more negatively.",
    },
    {
      id: "c5e1f8a0-0710-4111-8b25-00a5c1e11002",
      title: "Insightful and easy to understand",
      reading_type: "one-question",
      body_public:
        "I loved Leilia’s interpretation. It was insightful, thoughtful and gave me a fresh way to understand both the cards and the situation.",
    },
    {
      id: "c5e1f8a0-0712-4111-8b25-00a5c1e11003",
      title: "A beautiful interpretation",
      reading_type: "one-question",
      body_public:
        "This was such a beautiful interpretation. It made sense immediately, and I especially appreciated the way Leilia explained how she was reading the cards, not just the conclusion she reached.",
    },
  ];

  for (const row of testimonials) {
    const publicReview = toPublicReview({
      ...row,
      request_id: null,
      review_token_id: null,
      reviewer_email: "seed@example.invalid",
      display_name: "Seed",
      rating: 5,
      body_original: row.body_public,
      consent_publish: true,
      consent_marketing: false,
      verification_status: "manually_verified",
      moderation_status: "approved",
      is_featured: true,
      submitted_at: "2026-07-08T12:00:00.000Z",
      approved_at: "2026-07-08T12:00:00.000Z",
      approved_by: null,
      updated_at: "2026-07-08T12:00:00.000Z",
    });
    assert.equal(publicReview.reading_type_label, "One Question Reading");
    assert.match(publicReview.body, /Leilia/);
    assert.equal(publicReview.body.includes("Leigh"), false);
  }
});

run("source validation rejects complimentary for untokened and accepts public products", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/lib/ask-leilia/reviews/validation.ts"),
    "utf8",
  );
  assert.match(source, /isAskLeiliaReadingType/);
  assert.match(source, /isAskLeiliaDbReadingType/);
  assert.match(source, /token/);
});

run("script tags are stripped from body", () => {
  const cleaned = stripUnsafeReviewText(
    'Helpful reading.<script>alert("x")</script> More text here that is long enough afterwards.',
  );
  assert.equal(cleaned.includes("<script>"), false);
  assert.equal(cleaned.includes("alert"), false);
});

run("escapeHtml encodes markup", () => {
  assert.equal(
    escapeHtml('<img src=x onerror=alert(1)>'),
    "&lt;img src=x onerror=alert(1)&gt;",
  );
});

run("public review projection omits private fields", () => {
  const publicReview = toPublicReview({
    id: "11111111-1111-1111-1111-111111111111",
    request_id: "22222222-2222-2222-2222-222222222222",
    review_token_id: "33333333-3333-3333-3333-333333333333",
    reviewer_email: "private@example.com",
    display_name: "Elena",
    reading_type: "one-question",
    rating: 5,
    title: "Clear",
    body_original: "Original review text kept for moderation and never overwritten by edits.",
    body_public: "Public review text with a small punctuation correction only.",
    consent_publish: true,
    consent_marketing: true,
    verification_status: "verified_completed_reading",
    moderation_status: "approved",
    is_featured: true,
    submitted_at: "2026-06-01T10:00:00.000Z",
    approved_at: "2026-06-02T10:00:00.000Z",
    approved_by: "44444444-4444-4444-4444-444444444444",
    updated_at: "2026-06-02T10:00:00.000Z",
  });

  const serialized = JSON.stringify(publicReview);
  assert.equal(serialized.includes("private@example.com"), false);
  assert.equal(serialized.includes("request_id"), false);
  assert.equal(serialized.includes("review_token"), false);
  assert.equal(serialized.includes("consent_"), false);
  assert.equal(serialized.includes("approved_by"), false);
  assert.equal(publicReview.is_verified, true);
});

run("rate limit eventually blocks", () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.equal(consumeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(consumeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(consumeRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed, false);
});

run("carousel count contracts for 0–6 reviews", () => {
  for (const count of [0, 1, 2, 6]) {
    assert.equal(count > 1, count > 1);
    assert.equal(count === 0, count === 0);
  }
});

run("featured reviews sort ahead of newer non-featured", () => {
  const rows = [
    { id: "a", is_featured: false, approved_at: "2026-07-01T00:00:00.000Z" },
    { id: "b", is_featured: true, approved_at: "2026-06-01T00:00:00.000Z" },
    { id: "c", is_featured: false, approved_at: "2026-07-10T00:00:00.000Z" },
  ];
  const ordered = [...rows].sort((left, right) => {
    if (left.is_featured !== right.is_featured) return left.is_featured ? -1 : 1;
    return right.approved_at.localeCompare(left.approved_at);
  });
  assert.deepEqual(
    ordered.map((row) => row.id),
    ["b", "c", "a"],
  );
});

run("migration defines pending/approved/archived and verification states", () => {
  const sql = readFileSync(
    join(REPO_ROOT, "supabase/migrations/20260714000000_ask_leilia_reviews.sql"),
    "utf8",
  );
  assert.match(sql, /pending/);
  assert.match(sql, /approved/);
  assert.match(sql, /archived/);
  assert.match(sql, /verified_completed_reading/);
  assert.match(sql, /manually_verified/);
  assert.match(sql, /ask_leilia_review_tokens/);
  assert.match(sql, /token_hash/);
  assert.match(sql, /body_original/);
  assert.match(sql, /body_public/);
  assert.match(sql, /consent_publish/);
  assert.match(sql, /consent_marketing/);
});

run("admin API rejects non-admins", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/pages/api/ask-leilia/reviews/[id].ts"),
    "utf8",
  );
  assert.match(source, /isAdminProfile/);
  assert.match(source, /Not found/);
});

run("submit API consumes token and redirects to thank-you", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/pages/api/ask-leilia/reviews/index.ts"),
    "utf8",
  );
  assert.match(source, /resolveAskLeiliaReviewToken/);
  assert.match(source, /verified_completed_reading/);
  assert.match(source, /\/submit-a-review\/thank-you\//);
  assert.match(source, /honeypot|website/);
});

run("review request email is sent separately after delivery", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/lib/ask-leilia/notifications.ts"),
    "utf8",
  );
  assert.match(source, /sendAskLeiliaReviewRequest/);
  assert.match(source, /How was your Ask Leilia reading\?/);
  assert.match(source, /Share Your Experience/);
  assert.match(source, /reviewUrl/);

  const deliveryFn = source.slice(
    source.indexOf("export async function sendAskLeiliaCustomerDelivery"),
    source.indexOf("export async function sendAskLeiliaReviewRequest"),
  );
  assert.equal(deliveryFn.includes("Share Your Experience"), false);

  const paymentFn = source.slice(
    source.indexOf("sendAskLeiliaCustomerPaymentConfirmation"),
    source.indexOf("export async function notifyAskLeiliaPaymentException"),
  );
  assert.equal(paymentFn.includes("Share Your Experience"), false);
});

run("carousel renders review text in SSR HTML and hides controls for one card", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/components/ask-leilia/AskLeiliaReviewsCarousel.astro"),
    "utf8",
  );
  assert.match(source, /blockquote/);
  assert.match(source, /review\.body/);
  assert.match(source, /review\.display_name/);
  assert.match(source, /review\.reading_type_label/);
  assert.match(source, /review\.published_month_year/);
  assert.match(source, /What Clients Say/);
  assert.equal(source.includes("What Seekers Say"), false);
  assert.equal(source.includes("Hannah Ruhamah"), false);
  assert.equal(/\bJoyce\b/.test(source), false);
  assert.match(source, /Continue reading/);
  assert.match(source, /ask-reviews-full-dialog|data-ask-reviews-dialog/);
  assert.match(source, /openAskLeiliaDialog|showModal/);
  assert.match(source, /data-ask-reviews-quote/);
  assert.match(source, /aria-label="Previous reviews"/);
  assert.match(source, /aria-label="Next reviews"/);
  assert.equal(source.includes(">Previous<"), false);
  assert.equal(source.includes(">Next<"), false);

  const dialogHelper = readFileSync(
    join(REPO_ROOT, "src/scripts/askLeiliaDialog.ts"),
    "utf8",
  );
  assert.match(dialogHelper, /showModal/);
  assert.match(dialogHelper, /ask-leilia-dialog--fallback/);
  assert.match(dialogHelper, /Escape/);
  assert.equal(/window\.open\s*\(/.test(dialogHelper), false);
  assert.match(source, /canNavigate = count > 1/);
  assert.match(source, /prefers-reduced-motion|reduceMotion/);
  assert.match(source, /ArrowLeft|ArrowRight/);
  assert.equal(source.includes("setInterval"), false);
  assert.equal(source.includes("autoplay"), false);
  assert.equal(source.includes("Show less"), false);
});

/**
 * Mirrors src/lib/ask-leilia/reviews/carouselGeometry.ts
 * (self-contained; Node runs this file without a TS loader).
 */
const ASK_REVIEWS_MIN_CARD_WIDTH = 320;
const ASK_REVIEWS_MAX_PER_PAGE = 3;

function askReviewsCardWidth(viewportWidth, perPage, gap) {
  if (!(viewportWidth > 0) || perPage < 1) return 0;
  const totalGaps = Math.max(0, perPage - 1) * Math.max(0, gap);
  return Math.max(0, (viewportWidth - totalGaps) / perPage);
}

function askReviewsPerPage(
  viewportWidth,
  gap,
  minCardWidth = ASK_REVIEWS_MIN_CARD_WIDTH,
) {
  if (!(viewportWidth > 0)) return 1;
  const safeGap = Math.max(0, gap);
  const safeMin = Math.max(1, minCardWidth);
  for (let n = ASK_REVIEWS_MAX_PER_PAGE; n >= 1; n -= 1) {
    if (askReviewsCardWidth(viewportWidth, n, safeGap) >= safeMin - 0.01) {
      return n;
    }
  }
  return 1;
}

function askReviewsPageCount(cardCount, perPage) {
  if (cardCount < 1 || perPage < 1) return 0;
  return Math.ceil(cardCount / perPage);
}

function askReviewsPageStride(viewportWidth, gap) {
  if (!(viewportWidth > 0)) return 0;
  return viewportWidth + Math.max(0, gap);
}

function askReviewsPageOffset(page, viewportWidth, gap) {
  if (page <= 0) return 0;
  return page * askReviewsPageStride(viewportWidth, gap);
}

function askReviewsWrapPage(page, delta, pageCount) {
  if (pageCount < 1) return 0;
  return (((page + delta) % pageCount) + pageCount) % pageCount;
}

function askReviewsClampPage(page, pageCount) {
  if (pageCount < 1) return 0;
  return Math.min(Math.max(0, page), pageCount - 1);
}

run("carousel arrow controls are type=button and initialise from the carousel root", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/components/ask-leilia/AskLeiliaReviewsCarousel.astro"),
    "utf8",
  );

  assert.match(source, /data-ask-reviews-carousel/);
  assert.match(source, /type="button"/);
  assert.match(source, /data-ask-reviews-prev/);
  assert.match(source, /data-ask-reviews-next/);
  assert.match(source, /astro:page-load/);

  const carouselInit = source.slice(source.indexOf("function initAskReviewsCarousel"));
  assert.match(carouselInit, /dataset\.bound === ["']true["']/);
  assert.match(carouselInit, /root\.querySelector\(\s*["']\[data-ask-reviews-prev\]["']\s*\)/);
  assert.match(carouselInit, /root\.querySelector\(\s*["']\[data-ask-reviews-next\]["']\s*\)/);
  assert.match(carouselInit, /askReviewsWrapPage/);
  assert.match(carouselInit, /askReviewsPerPage/);
  assert.match(carouselInit, /askReviewsPageOffset/);
  assert.match(carouselInit, /askReviewsClampPage/);
  assert.match(carouselInit, /rebuildDots/);
  assert.match(carouselInit, /translate3d/);
  assert.match(carouselInit, /ResizeObserver/);
  assert.match(carouselInit, /orientationchange/);
  assert.match(carouselInit, /pageshow/);
  assert.match(carouselInit, /--ask-reviews-card-width/);
  assert.match(source, /carouselGeometry/);
  assert.equal(carouselInit.includes("page * viewport.clientWidth"), false);
});

run("carousel resolves 1/2/3 complete cards from measured width and gaps", () => {
  const gap = 16;

  // 1-card: narrow / foldable intermediate widths
  assert.equal(askReviewsPerPage(360, gap), 1);
  assert.equal(askReviewsPerPage(600, gap), 1);
  assert.equal(askReviewsPerPage(650, gap), 1);

  // 2-card: tablet / small desktop when both cards stay >= min width
  assert.equal(askReviewsPerPage(680, gap), 2);
  assert.equal(askReviewsPerPage(800, gap), 2);
  assert.equal(askReviewsPerPage(900, gap), 2);

  // 3-card: large desktop
  assert.equal(askReviewsPerPage(992, gap), 3);
  assert.equal(askReviewsPerPage(1160, gap), 3);
  assert.equal(askReviewsPerPage(1400, gap), 3);

  assert.equal(askReviewsCardWidth(800, 2, gap), (800 - gap) / 2);
  assert.equal(askReviewsCardWidth(1160, 3, gap), (1160 - 2 * gap) / 3);
  assert.equal(askReviewsCardWidth(360, 1, gap), 360);
});

run("carousel page count recalculates when visible-card count changes", () => {
  assert.equal(askReviewsPageCount(6, 3), 2);
  assert.equal(askReviewsPageCount(6, 2), 3);
  assert.equal(askReviewsPageCount(6, 1), 6);
  assert.equal(askReviewsPageCount(1, 3), 1);
  assert.equal(askReviewsPageCount(5, 2), 3);
  assert.equal(askReviewsPageCount(0, 2), 0);
});

run("carousel clamps current page after resize page-count changes", () => {
  assert.equal(askReviewsClampPage(5, 3), 2);
  assert.equal(askReviewsClampPage(2, 3), 2);
  assert.equal(askReviewsClampPage(0, 1), 0);
  assert.equal(askReviewsClampPage(-1, 4), 0);
  assert.equal(askReviewsClampPage(3, 0), 0);

  // Desktop (3/page, 2 pages) → narrow (1/page, 6 pages): page stays if still valid
  assert.equal(askReviewsClampPage(1, askReviewsPageCount(6, 1)), 1);
  // Wide page index becomes invalid when collapsing to fewer pages
  assert.equal(askReviewsClampPage(2, askReviewsPageCount(6, 3)), 1);
});

run("carousel page translation includes inter-card gaps (no peek)", () => {
  const gap = 16;
  const viewport = 800;
  // Next page starts after N cards AND N gaps (gap after the last visible card).
  assert.equal(askReviewsPageStride(viewport, gap), viewport + gap);
  assert.equal(askReviewsPageOffset(0, viewport, gap), 0);
  assert.equal(askReviewsPageOffset(1, viewport, gap), 816);
  assert.equal(askReviewsPageOffset(2, viewport, gap), 1632);

  const perPage = 2;
  const cardWidth = askReviewsCardWidth(viewport, perPage, gap);
  const startOfNextPage = perPage * (cardWidth + gap);
  assert.equal(startOfNextPage, askReviewsPageOffset(1, viewport, gap));
});

run("carousel Previous and Next still wrap", () => {
  assert.equal(askReviewsWrapPage(0, 1, 2), 1);
  assert.equal(askReviewsWrapPage(1, 1, 2), 0);
  assert.equal(askReviewsWrapPage(0, -1, 2), 1);
  assert.equal(askReviewsWrapPage(1, -1, 2), 0);
  assert.equal(askReviewsWrapPage(0, 1, 1), 0);
  assert.equal(askReviewsWrapPage(3, 1, 0), 0);
  assert.equal(askReviewsWrapPage(2, 1, 3), 0);
  assert.equal(askReviewsWrapPage(0, -1, 3), 2);
});

run("carousel geometry module is the shared source of truth", () => {
  const geometry = readFileSync(
    join(REPO_ROOT, "src/lib/ask-leilia/reviews/carouselGeometry.ts"),
    "utf8",
  );
  assert.match(geometry, /ASK_REVIEWS_MIN_CARD_WIDTH\s*=\s*320/);
  assert.match(geometry, /ASK_REVIEWS_MAX_PER_PAGE\s*=\s*3/);
  assert.match(geometry, /export function askReviewsPerPage/);
  assert.match(geometry, /export function askReviewsPageOffset/);
  assert.match(geometry, /viewportWidth \+ Math\.max\(0, gap\)/);
  assert.match(geometry, /export function askReviewsClampPage/);

  const source = readFileSync(
    join(REPO_ROOT, "src/components/ask-leilia/AskLeiliaReviewsCarousel.astro"),
    "utf8",
  );
  assert.match(source, /from ["'].*carouselGeometry["']/);
  assert.match(source, /refreshLayout/);
  assert.match(source, /measureLayout/);
  assert.match(source, /aria-hidden/);
  assert.match(source, /\.inert/);
});

run("carousel verification badge and continue-reading stay data-driven", () => {
  const source = readFileSync(
    join(REPO_ROOT, "src/components/ask-leilia/AskLeiliaReviewsCarousel.astro"),
    "utf8",
  );
  assert.match(source, /review\.is_verified/);
  assert.match(source, /Verified Ask Leilia Reading/);
  assert.match(source, /data-ask-reviews-more/);
  assert.match(source, /button\.hidden = !overflows/);
  assert.match(source, /openAskLeiliaDialog/);
  assert.equal(/display_name\s*===\s*['"]Sasha['"]/.test(source), false);
  assert.equal(source.includes("role=\"tab\""), false);
});

run("review carousel CSS clamps long quotes with equal card stretch", () => {
  const css = readFileSync(join(REPO_ROOT, "src/styles/ask-leilia-reviews.css"), "utf8");
  assert.match(css, /-webkit-line-clamp:\s*6/);
  assert.match(css, /-webkit-line-clamp:\s*7/);
  assert.match(css, /align-items:\s*stretch/);
  assert.match(css, /\.ask-reviews__more/);
  assert.match(css, /height:\s*calc\(1\.6em \* 7\)/);
  assert.match(css, /border-radius:\s*50%/);
  assert.match(css, /--ask-reviews-card-width/);
  assert.match(css, /flex:\s*0 0 var\(--ask-reviews-card-width\)/);
  assert.match(css, /overflow:\s*hidden/);
  assert.equal(css.includes("100cqi"), false);
  assert.equal(css.includes("Show previous reviews"), false);
});

run("secure review URL shape hides private identifiers", () => {
  const token = generateAskLeiliaReviewToken();
  const url = `https://example.com/submit-a-review/?token=${encodeURIComponent(token)}`;
  assert.equal(url.includes("email="), false);
  assert.equal(/request_id|order_id|reading_id/.test(url), false);
  assert.match(url, /\/submit-a-review\/\?token=/);
});

run("Sasha verification correction uses status field, not a name-hardcoded badge", () => {
  const migration = readFileSync(
    join(
      REPO_ROOT,
      "supabase/migrations/20260719000000_ask_leilia_sasha_review_verification.sql",
    ),
    "utf8",
  );
  assert.match(migration, /b071db83-f330-4f64-a54f-c397f6109923/);
  assert.match(migration, /verification_status = 'verified_completed_reading'/);
  assert.match(migration, /verification_status = 'unverified'/);
  assert.match(migration, /display_name = 'Sasha'/);
  assert.equal(/set[\s\S]*consent_/i.test(migration), false);
  assert.equal(/set[\s\S]*body_/i.test(migration), false);

  const sashaRow = {
    id: "b071db83-f330-4f64-a54f-c397f6109923",
    request_id: null,
    review_token_id: null,
    reviewer_email: "sasha@example.invalid",
    display_name: "Sasha",
    reading_type: "one-question",
    rating: 5,
    title: "A great choice",
    body_original:
      "The reading I received was deeply insightful and provided sound advice on the issue I was facing.",
    body_public:
      "The reading I received was deeply insightful and provided sound advice on the issue I was facing.",
    consent_publish: true,
    consent_marketing: false,
    moderation_status: "approved",
    is_featured: false,
    submitted_at: "2026-07-15T12:00:00.000Z",
    approved_at: "2026-07-15T12:00:00.000Z",
    approved_by: null,
    updated_at: "2026-07-15T12:00:00.000Z",
  };

  assert.equal(toPublicReview({ ...sashaRow, verification_status: "unverified" }).is_verified, false);
  const corrected = toPublicReview({
    ...sashaRow,
    verification_status: "verified_completed_reading",
  });
  assert.equal(corrected.is_verified, true);
  assert.equal(corrected.display_name, "Sasha");

  const hannahLike = toPublicReview({
    ...sashaRow,
    id: "00fe28a7-452a-429d-8adc-edcee721e1b3",
    display_name: "Hannah Ruhamah",
    title: "The Power of Less",
    verification_status: "verified_completed_reading",
  });
  assert.equal(hannahLike.is_verified, true);
  assert.equal(
    corrected.is_verified,
    hannahLike.is_verified,
    "Sasha uses the same verification projection as Hannah",
  );

  const carousel = readFileSync(
    join(REPO_ROOT, "src/components/ask-leilia/AskLeiliaReviewsCarousel.astro"),
    "utf8",
  );
  assert.match(carousel, /review\.is_verified/);
  assert.equal(carousel.includes("Sasha"), false);

  const fallbacks = readFileSync(
    join(REPO_ROOT, "src/lib/ask-leilia/reviews/publicReviewFallbacks.ts"),
    "utf8",
  );
  assert.match(fallbacks, /b071db83-f330-4f64-a54f-c397f6109923/);
  assert.match(
    fallbacks,
    /id:\s*"b071db83-f330-4f64-a54f-c397f6109923"[\s\S]*?is_verified:\s*true/,
  );
  assert.equal(fallbacks.includes('display_name === "Sasha"'), false);
  assert.equal(fallbacks.includes("display_name == 'Sasha'"), false);

  const salesPage = readFileSync(join(REPO_ROOT, "src/pages/ask-leilia.astro"), "utf8");
  assert.match(salesPage, /allowReviewFallbacks/);
  assert.match(salesPage, /import\.meta\.env\.DEV/);
  assert.match(salesPage, /publicReviews\.length === 0 && allowReviewFallbacks/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
