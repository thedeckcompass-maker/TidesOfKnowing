#!/usr/bin/env node
/**
 * Reading Library — unit tests (no live DB).
 * Run: npm run test:reading-library
 *
 * Self-contained (mirrors the behavioural contracts in
 * src/lib/readingLibrary/*), plus source-file assertions that guard the
 * security-critical projections, constraints, and route wiring introduced for
 * authorised sample readings.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let passed = 0;
let failed = 0;
function run(name, fn) {
  try {
    fn();
    console.log(`  ok — ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  FAIL — ${name}`);
    console.error(`         ${err.message}`);
    failed += 1;
  }
}

function readSource(rel) {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
}

// ---------------------------------------------------------------------------
// Mirrors of src/lib/readingLibrary contracts (kept in sync with the modules).
// ---------------------------------------------------------------------------

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateCoreDraft(draft) {
  if (draft.title.trim().length < 4) return { ok: false, error: "title" };
  if (!SLUG_PATTERN.test(draft.slug)) return { ok: false, error: "slug" };
  if (draft.summary.trim().length < 20 || draft.summary.trim().length > 500)
    return { ok: false, error: "summary" };
  if (draft.body.trim().length < 100) return { ok: false, error: "body" };
  if (draft.seoDescription.trim().length < 40 || draft.seoDescription.trim().length > 320)
    return { ok: false, error: "seo" };
  if (draft.isPublished && draft.primaryCards.length === 0)
    return { ok: false, error: "primary_cards" };
  return { ok: true };
}

// The only three valid public product labels (mirrors
// ASK_LEILIA_PUBLIC_READING_TYPE_LABELS). "Twelve-Month Reading" is not one.
const PUBLIC_READING_TYPE_LABELS = [
  "One Question Reading",
  "In-Depth Reading",
  "Personal Guidance Reading",
];

function validateAuthorisedSampleDraft(draft) {
  const core = validateCoreDraft(draft);
  if (!core.ok) return core;
  if (!PUBLIC_READING_TYPE_LABELS.includes(draft.readingType.trim()))
    return { ok: false, error: "reading_type" };
  if (draft.question.trim().length < 10 || draft.question.trim().length > 2000)
    return { ok: false, error: "question" };
  if (draft.displayNamePublic && !draft.clientDisplayName.trim())
    return { ok: false, error: "display_name" };
  if (draft.isPublished) {
    if (!draft.samplePdfStoragePath) return { ok: false, error: "pdf" };
    if (!draft.consentConfirmedAt) return { ok: false, error: "consent" };
  }
  return { ok: true };
}

function coerceSourceType(value) {
  return value === "ask_leilia_request" || value === "authorised_sample"
    ? value
    : "ask_leilia_request";
}

function mapPublicPublication(row) {
  return {
    id: row.id,
    sourceType: coerceSourceType(row.source_type),
    slug: row.slug,
    title: row.title,
    readingType: row.reading_type,
    question: row.question,
    summary: row.summary,
    body: row.body,
    lifeAreas: row.life_areas ?? [],
    primaryCards: row.primary_cards ?? [],
    spreadUsed: row.spread_used,
    spreadImagePaths: row.spread_image_paths ?? [],
    seoDescription: row.seo_description,
    isPublished: row.is_published,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    updatedAt: new Date(row.updated_at),
  };
}

function baseSampleDraft(overrides = {}) {
  return {
    title: "A twelve-month reading",
    slug: "a-twelve-month-reading",
    summary: "An anonymised twelve-month reading exploring change and direction over a year.",
    body: "The reading opens with a question about direction. ".repeat(6),
    seoDescription:
      "An anonymised twelve-month tarot reading exploring change and direction across a full year.",
    lifeAreas: ["Purpose"],
    primaryCards: ["The Star"],
    spreadUsed: "Twelve Month Timeline",
    spreadImagePaths: [],
    isPublished: false,
    readingType: "Personal Guidance Reading",
    question: "What should I focus on over the coming year?",
    clientDisplayName: "",
    displayNamePublic: false,
    consentConfirmedAt: null,
    consentScope: "",
    consentNote: "",
    samplePdfStoragePath: null,
    ...overrides,
  };
}

function fullRow(overrides = {}) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    source_type: "authorised_sample",
    ask_leilia_request_id: null,
    slug: "sample-reading",
    title: "Sample reading",
    reading_type: "In-Depth Reading",
    question: "What is being asked of me?",
    summary: "An anonymised in-depth reading with enough summary text to satisfy validation.",
    body: "Body text long enough to be valid. ".repeat(6),
    life_areas: ["Career"],
    primary_cards: ["The Tower"],
    spread_used: "Custom",
    spread_image_paths: ["/images/client-readings/sample-reading/sample-reading-1.jpg"],
    seo_description: "An anonymised in-depth tarot reading exploring a career crossroads and change.",
    pdf_storage_path: null,
    sample_pdf_storage_path: "reading-library-samples/sample-reading/abc.pdf",
    sample_client_display_name: "Private Name",
    sample_display_name_public: false,
    sample_consent_confirmed_at: "2026-07-10T00:00:00.000Z",
    sample_consent_scope: "email",
    sample_consent_note: "Confidential internal note about consent.",
    is_published: true,
    published_at: "2026-07-11T00:00:00.000Z",
    updated_at: "2026-07-11T00:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Existing request-linked publication behaviour remains valid.
// ---------------------------------------------------------------------------
run("request-linked draft still validates with the original core rules", () => {
  const result = validateCoreDraft({
    title: "Relationship crossroads",
    slug: "relationship-crossroads",
    summary: "An anonymised reading exploring a relationship decision at a crossroads point.",
    body: "A detailed written interpretation. ".repeat(6),
    seoDescription: "An anonymised one-question tarot reading about a relationship crossroads.",
    primaryCards: ["The Lovers"],
    isPublished: true,
  });
  assert.equal(result.ok, true);
});

run("request-linked publish still requires at least one primary card", () => {
  const result = validateCoreDraft({
    title: "Relationship crossroads",
    slug: "relationship-crossroads",
    summary: "An anonymised reading exploring a relationship decision at a crossroads point.",
    body: "A detailed written interpretation. ".repeat(6),
    seoDescription: "An anonymised one-question tarot reading about a relationship crossroads.",
    primaryCards: [],
    isPublished: true,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "primary_cards");
});

// ---------------------------------------------------------------------------
// 2. Existing rows resolve as ask_leilia_request.
// ---------------------------------------------------------------------------
run("null/unknown source_type coerces to ask_leilia_request", () => {
  assert.equal(coerceSourceType(null), "ask_leilia_request");
  assert.equal(coerceSourceType(undefined), "ask_leilia_request");
  assert.equal(coerceSourceType("something-else"), "ask_leilia_request");
  assert.equal(coerceSourceType("authorised_sample"), "authorised_sample");
});

run("migration defaults and backfills existing rows to ask_leilia_request", () => {
  const sql = readSource(
    "supabase/migrations/20260718000000_reading_library_authorised_samples.sql",
  );
  assert.match(sql, /source_type text not null default 'ask_leilia_request'/);
  assert.match(sql, /update public\.reading_library_publications\s+set source_type = 'ask_leilia_request'/);
});

// ---------------------------------------------------------------------------
// 3. An authorised sample may exist without an Ask Leilia request.
// ---------------------------------------------------------------------------
run("authorised sample draft validates as a draft without a request", () => {
  const result = validateAuthorisedSampleDraft(baseSampleDraft());
  assert.equal(result.ok, true);
});

run("migration forbids a request id on authorised samples", () => {
  const sql = readSource(
    "supabase/migrations/20260718000000_reading_library_authorised_samples.sql",
  );
  assert.match(sql, /reading_library_publications_sample_no_request/);
  assert.match(sql, /source_type <> 'authorised_sample' or ask_leilia_request_id is null/);
});

// ---------------------------------------------------------------------------
// 4 & 5. Publish gating for consent and private PDF.
// ---------------------------------------------------------------------------
run("authorised sample cannot be published without confirmed consent", () => {
  const result = validateAuthorisedSampleDraft(
    baseSampleDraft({
      isPublished: true,
      samplePdfStoragePath: "reading-library-samples/x/y.pdf",
      consentConfirmedAt: null,
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, "consent");
});

run("authorised sample cannot be published without a private PDF path", () => {
  const result = validateAuthorisedSampleDraft(
    baseSampleDraft({
      isPublished: true,
      consentConfirmedAt: "2026-07-10T00:00:00.000Z",
      samplePdfStoragePath: null,
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, "pdf");
});

run("authorised sample publishes when consent and PDF are present", () => {
  const result = validateAuthorisedSampleDraft(
    baseSampleDraft({
      isPublished: true,
      consentConfirmedAt: "2026-07-10T00:00:00.000Z",
      samplePdfStoragePath: "reading-library-samples/x/y.pdf",
    }),
  );
  assert.equal(result.ok, true);
});

run("migration enforces the sample publish-ready constraint", () => {
  const sql = readSource(
    "supabase/migrations/20260718000000_reading_library_authorised_samples.sql",
  );
  assert.match(sql, /reading_library_publications_sample_publish_ready/);
  assert.match(sql, /sample_pdf_storage_path is not null and sample_consent_confirmed_at is not null/);
});

// ---------------------------------------------------------------------------
// 6. Request-linked publication still requires a genuine Delivered request.
// ---------------------------------------------------------------------------
run("request-linked publish API still gates on a Delivered request", () => {
  const src = readSource("src/pages/api/ask-leilia/reading-library/[requestId].ts");
  assert.match(src, /askRequest\.status !== "Delivered"/);
  assert.match(src, /Only delivered readings can be added to the Reading Library\./);
});

run("migration requires a request id for request-linked rows", () => {
  const sql = readSource(
    "supabase/migrations/20260718000000_reading_library_authorised_samples.sql",
  );
  assert.match(sql, /reading_library_publications_request_requires_id/);
  assert.match(sql, /source_type <> 'ask_leilia_request' or ask_leilia_request_id is not null/);
});

// ---------------------------------------------------------------------------
// 7. Public projections omit all consent and private-storage fields.
// ---------------------------------------------------------------------------
run("public mapper omits request id, storage paths, and consent metadata", () => {
  const publicShape = mapPublicPublication(fullRow());
  const serialized = JSON.stringify(publicShape);
  assert.equal(serialized.includes("consent"), false);
  assert.equal(serialized.includes("reading-library-samples/"), false);
  assert.equal(serialized.includes("pdf_storage"), false);
  assert.equal(serialized.includes("Private Name"), false);
  assert.equal("askLeiliaRequestId" in publicShape, false);
  assert.equal("pdfStoragePath" in publicShape, false);
  assert.equal("samplePdfStoragePath" in publicShape, false);
  assert.equal("sampleConsentNote" in publicShape, false);
  assert.equal(publicShape.sourceType, "authorised_sample");
});

run("queries public projection excludes storage/consent/request columns", () => {
  const src = readSource("src/lib/readingLibrary/queries.ts");
  const publicMatch = src.match(/const PUBLIC_COLUMNS =\s*"([^"]+)"/);
  assert.ok(publicMatch, "PUBLIC_COLUMNS not found");
  const publicColumns = publicMatch[1];
  for (const forbidden of [
    "ask_leilia_request_id",
    "pdf_storage_path",
    "sample_pdf_storage_path",
    "sample_consent_confirmed_at",
    "sample_consent_scope",
    "sample_consent_note",
    "sample_client_display_name",
  ]) {
    assert.equal(
      publicColumns.includes(forbidden),
      false,
      `PUBLIC_COLUMNS must not include ${forbidden}`,
    );
  }
  // Admin projection intentionally includes them.
  assert.match(src, /ADMIN_COLUMNS = `\$\{PUBLIC_COLUMNS\}[^`]*sample_consent_note`/);
});

run("public publication type has no storage-path or request-id field", () => {
  const src = readSource("src/lib/readingLibrary/types.ts");
  const publicType = src.slice(
    src.indexOf("export type ReadingLibraryPublication = {"),
    src.indexOf("export type ReadingLibraryAdminPublication"),
  );
  assert.equal(publicType.includes("pdfStoragePath"), false);
  assert.equal(publicType.includes("askLeiliaRequestId"), false);
  assert.equal(publicType.includes("Consent"), false);
});

// ---------------------------------------------------------------------------
// 8. Unpublished authorised samples do not appear publicly.
// ---------------------------------------------------------------------------
run("public queries filter on is_published = true", () => {
  const src = readSource("src/lib/readingLibrary/queries.ts");
  const listFn = src.slice(
    src.indexOf("export async function getPublishedLibraryPublications"),
    src.indexOf("export async function getPublishedLibraryPublicationBySlug"),
  );
  assert.match(listFn, /\.eq\("is_published", true\)/);
  const bySlugFn = src.slice(
    src.indexOf("export async function getPublishedLibraryPublicationBySlug"),
    src.indexOf("export async function resolveLibraryPdfSource"),
  );
  assert.match(bySlugFn, /\.eq\("is_published", true\)/);
});

run("pure filter: only published rows are returned", () => {
  const rows = [
    fullRow({ id: "a", is_published: true }),
    fullRow({ id: "b", is_published: false }),
  ];
  const published = rows.filter((r) => r.is_published).map(mapPublicPublication);
  assert.deepEqual(
    published.map((p) => p.id),
    ["a"],
  );
});

// ---------------------------------------------------------------------------
// 9. Unpublished authorised sample PDFs cannot be retrieved.
// ---------------------------------------------------------------------------
run("PDF source resolver only considers published readings", () => {
  const src = readSource("src/lib/readingLibrary/queries.ts");
  const fn = src.slice(
    src.indexOf("export async function resolveLibraryPdfSource"),
    src.indexOf("export async function getLibraryPublicationByRequestId"),
  );
  assert.match(fn, /\.eq\("is_published", true\)/);
  assert.match(fn, /if \(!storagePath\) return null;/);
});

run("public PDF route returns 404 when no source resolves", () => {
  const src = readSource("src/pages/api/reading-library/[slug]/pdf.ts");
  assert.match(src, /resolveLibraryPdfSource/);
  assert.match(src, /if \(!source\) \{[\s\S]*?404/);
});

// ---------------------------------------------------------------------------
// 10. Published authorised sample PDFs use the signed private-storage route.
// ---------------------------------------------------------------------------
run("sample storage uses the private bucket and auditable prefix", () => {
  const src = readSource("src/lib/readingLibrary/storage.ts");
  assert.match(src, /READING_LIBRARY_BUCKET = "ask-leilia-uploads"/);
  assert.match(src, /READING_LIBRARY_SAMPLE_PREFIX = "reading-library-samples"/);
  assert.match(
    src,
    /\$\{READING_LIBRARY_SAMPLE_PREFIX\}\/\$\{safeSlug\}\/\$\{crypto\.randomUUID\(\)\}\.pdf/,
  );
  // Never writes to a public downloads path, never marks the bucket public.
  assert.equal(src.includes("public/downloads"), false);
  assert.equal(src.includes("public: true"), false);
  assert.equal(src.includes(".from(\"public"), false);
});

// Mirror of storage.safeSampleSlug (slugify + slice).
function safeSampleSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

run("storage slug sanitisation prevents path traversal and stray separators", () => {
  const src = readSource("src/lib/readingLibrary/storage.ts");
  // The module must derive the path segment through the sanitiser, not raw input.
  assert.match(src, /import \{ slugify \} from/);
  assert.match(src, /export function safeSampleSlug/);
  assert.match(src, /const safeSlug = safeSampleSlug\(slug\)/);
  assert.match(src, /if \(!safeSlug\) \{[\s\S]*?A valid slug is required/);

  for (const evil of ["../../etc/passwd", "a/../../b", "..\\..\\win", "foo/bar", "slug with spaces"]) {
    const safe = safeSampleSlug(evil);
    assert.equal(safe.includes("/"), false, `slug must not contain / (${evil})`);
    assert.equal(safe.includes("\\"), false, `slug must not contain backslash (${evil})`);
    assert.equal(safe.includes(".."), false, `slug must not contain .. (${evil})`);
    const path = `reading-library-samples/${safe}/id.pdf`;
    assert.equal(path.split("/").length, 3, `path must have exactly one slug segment (${evil})`);
  }
  // Fully-stripped input yields an empty slug that the upload guard rejects.
  assert.equal(safeSampleSlug("..."), "");
});

run("empty/whitespace-only PDF uploads and oversized files are rejected", () => {
  const src = readSource("src/lib/readingLibrary/storage.ts");
  assert.match(src, /application\/pdf/);
  assert.match(src, /MAX_PDF_BYTES = 12 \* 1024 \* 1024/);
  assert.match(src, /file\.size > MAX_PDF_BYTES/);
  assert.match(src, /file\.size < 1/);
  assert.match(src, /upsert: false/);
});

// ---------------------------------------------------------------------------
// Private PDF lifecycle: no orphans on failure, no stale references on replace.
// ---------------------------------------------------------------------------
run("upload is rolled back when full validation fails", () => {
  const src = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  const validationBlock = src.slice(
    src.indexOf("const validation = validateAuthorisedSampleDraft(draft);"),
    src.indexOf("const result = await upsertAuthorisedSample"),
  );
  assert.match(validationBlock, /if \(uploadedPath\) await removeAuthorisedSamplePdfObject\(service, uploadedPath\)/);
});

run("upload is rolled back when the database save fails", () => {
  const src = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  const resultBlock = src.slice(
    src.indexOf("if (!result.ok) {"),
    src.indexOf("// Clean up the superseded PDF object"),
  );
  assert.match(resultBlock, /if \(uploadedPath\) await removeAuthorisedSamplePdfObject\(service, uploadedPath\)/);
});

run("replacing a sample PDF removes the superseded object only after success", () => {
  const src = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  const cleanup = src.slice(src.indexOf("// Clean up the superseded PDF object"));
  assert.match(cleanup, /existing\.samplePdfStoragePath !== uploadedPath/);
  assert.match(cleanup, /removeAuthorisedSamplePdfObject\(service, existing\.samplePdfStoragePath\)/);
  // Cleanup happens after the upsert succeeds (below the !result.ok guard).
  assert.ok(
    src.indexOf("// Clean up the superseded PDF object") >
      src.indexOf("const result = await upsertAuthorisedSample"),
  );
});

run("editing a non-existent or non-sample id is rejected", () => {
  const src = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  assert.match(src, /getAuthorisedSampleById\(service, idParam\)/);
  assert.match(src, /if \(!isCreate && !existing\)[\s\S]*?Authorised sample not found/);
  const queries = readSource("src/lib/readingLibrary/queries.ts");
  const fn = queries.slice(queries.indexOf("export async function getAuthorisedSampleById"));
  assert.match(fn, /\.eq\("source_type", "authorised_sample"\)/);
});

run("PDF route signs the resolved private path", () => {
  const src = readSource("src/pages/api/reading-library/[slug]/pdf.ts");
  assert.match(src, /getAskLeiliaDeliveryPdfUrl\(service, source\.storagePath\)/);
  assert.match(src, /Response\.redirect\(signedUrl, 302\)/);
});

run("PDF resolver chooses sample path for samples, delivery path otherwise", () => {
  const src = readSource("src/lib/readingLibrary/queries.ts");
  assert.match(
    src,
    /sourceType === "authorised_sample" \? row\.sample_pdf_storage_path : row\.pdf_storage_path/,
  );
});

// ---------------------------------------------------------------------------
// Security: admin-only writes and hardened table access.
// ---------------------------------------------------------------------------
run("authorised sample admin API requires an admin profile", () => {
  const src = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  assert.match(src, /isAdminProfile\(locals\.profile\)/);
  assert.match(src, /Not found/);
});

run("migration revokes anon/authenticated access and drops the public read policy", () => {
  const sql = readSource(
    "supabase/migrations/20260718000000_reading_library_authorised_samples.sql",
  );
  assert.match(sql, /revoke all on table public\.reading_library_publications from anon, authenticated;/);
  assert.match(sql, /drop policy if exists "Anyone can read published library readings"/);
  assert.match(sql, /grant select, insert, update, delete on table public\.reading_library_publications to service_role;/);
});

run("admin API never links a sample to an Ask Leilia request", () => {
  const queries = readSource("src/lib/readingLibrary/queries.ts");
  const fn = queries.slice(
    queries.indexOf("export async function upsertAuthorisedSample"),
    queries.length,
  );
  assert.match(fn, /ask_leilia_request_id: null/);
  assert.match(fn, /source_type: "authorised_sample"/);
});

// ---------------------------------------------------------------------------
// 12. No Markdown created under src/content/recent-client-readings.
// ---------------------------------------------------------------------------
run("no markdown exists under src/content/recent-client-readings", () => {
  const dir = join(REPO_ROOT, "src/content/recent-client-readings");
  if (!existsSync(dir)) return; // acceptable: intentionally absent
  const markdown = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".md"));
  assert.deepEqual(markdown, []);
});

// ---------------------------------------------------------------------------
// 13. No PDF is added under public/ by the authorised-sample feature, and the
//     legacy public client-reading PDFs have been removed.
// ---------------------------------------------------------------------------
function pdfsUnder(relDir) {
  const dir = join(REPO_ROOT, relDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
}

run("authorised sample PDFs never target a public directory", () => {
  assert.equal(existsSync(join(REPO_ROOT, "public/downloads/reading-library-samples")), false);
  assert.equal(existsSync(join(REPO_ROOT, "public/reading-library-samples")), false);
});

run("no client-reading PDFs remain under public/downloads/client-readings", () => {
  assert.deepEqual(pdfsUnder("public/downloads/client-readings"), []);
});

run("no sample/client-reading PDFs exist anywhere under public/", () => {
  // Walk public/ and assert no reading PDFs slipped into any public directory.
  const offenders = [];
  const walk = (relDir) => {
    const abs = join(REPO_ROOT, relDir);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const rel = `${relDir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(rel);
      } else if (
        entry.name.toLowerCase().endsWith(".pdf") &&
        (rel.includes("client-readings") || rel.includes("reading-library"))
      ) {
        offenders.push(rel);
      }
    }
  };
  walk("public");
  assert.deepEqual(offenders, []);
});

run("the four candidate readings are not hardcoded in application code", () => {
  for (const rel of [
    "src/lib/readingLibrary/queries.ts",
    "src/lib/readingLibrary/validation.ts",
    "src/lib/readingLibrary/storage.ts",
    "src/lib/readingLibrary/types.ts",
    "src/pages/ask-leilia/admin/samples.astro",
    "src/components/ask-leilia/AuthorisedSampleForm.astro",
    "src/pages/api/ask-leilia/reading-library/samples/[id].ts",
  ]) {
    const src = readSource(rel).toLowerCase();
    for (const name of ["hannah", "sasha", "shelley", "shelly"]) {
      assert.equal(src.includes(name), false, `${rel} must not hardcode ${name}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Admin workflow: single create panel, compact cards, one-step publish, and
// error-preserving fetch submission (no redirect that clears the form).
// ---------------------------------------------------------------------------
run("draft save retains entered values: submission is fetch-based, not a clearing redirect", () => {
  const page = readSource("src/pages/ask-leilia/admin/samples.astro");
  // The active form submits via fetch with preventDefault, so the browser never
  // reloads and typed values are never discarded on validation failure.
  assert.match(page, /event\.preventDefault\(\)/);
  assert.match(page, /fetch\(form\.action/);
  assert.match(page, /Accept: "application\/json"/);
  // On error the banner is shown; the form is never reset or cleared.
  assert.equal(page.includes("form.reset()"), false, "form must never be reset on error");
  const api = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  // For JSON callers, failures return JSON (no redirect that reloads the page).
  assert.match(api, /function wantsJson/);
  assert.match(api, /if \(!wantsJson\(request\)\) return redirectSamples\("error"/);
  assert.match(api, /return json\(\{ ok: false, error: message \}, statusCode\)/);
});

run("publication is intent-driven and validated in one submission", () => {
  const api = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  assert.match(api, /String\(form\.get\("intent"\) \?\? ""\)\.trim\(\) === "publish"/);
  assert.match(api, /isPublished: wantsPublish/);
  // The full publish gate runs on the same request before upsert.
  assert.match(api, /const validation = validateAuthorisedSampleDraft\(draft\);/);
  assert.ok(
    api.indexOf("validateAuthorisedSampleDraft(draft)") <
      api.indexOf("await upsertAuthorisedSample"),
    "full validation must run before upsert",
  );
});

run("one-step publish requires consent and PDF (mirror behaviour)", () => {
  // Missing PDF blocks publish.
  assert.equal(
    validateAuthorisedSampleDraft(
      baseSampleDraft({ isPublished: true, consentConfirmedAt: "2026-07-10T00:00:00.000Z", samplePdfStoragePath: null }),
    ).ok,
    false,
  );
  // Missing consent blocks publish.
  assert.equal(
    validateAuthorisedSampleDraft(
      baseSampleDraft({ isPublished: true, samplePdfStoragePath: "reading-library-samples/x/y.pdf", consentConfirmedAt: null }),
    ).ok,
    false,
  );
  // Both present publishes in the same submission.
  assert.equal(
    validateAuthorisedSampleDraft(
      baseSampleDraft({ isPublished: true, samplePdfStoragePath: "reading-library-samples/x/y.pdf", consentConfirmedAt: "2026-07-10T00:00:00.000Z" }),
    ).ok,
    true,
  );
});

run("existing PDF stays attached unless a replacement is uploaded", () => {
  const api = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  assert.match(api, /uploadedPath \?\? existing\?\.samplePdfStoragePath \?\? null/);
  // A new File is only uploaded when one was actually chosen.
  assert.match(api, /samplePdf instanceof File && samplePdf\.size > 0/);
  const form = readSource("src/components/ask-leilia/AuthorisedSampleForm.astro");
  // The UI explains an already-uploaded PDF instead of the misleading "No file chosen".
  assert.match(form, /Private PDF already uploaded/);
});

run("saved readings render as compact cards with a collapsed edit panel", () => {
  const page = readSource("src/pages/ask-leilia/admin/samples.astro");
  assert.match(page, /samples\.map\(\(sample\) =>/);
  assert.match(page, /class="rls-card"/);
  // Every edit form starts hidden; it is not an always-expanded form.
  assert.match(page, /id=\{`edit-\$\{sample\.id\}`\} hidden/);
  assert.match(page, /class="rls-card__edit"/);
});

run("only the selected record opens for editing (others collapse)", () => {
  const page = readSource("src/pages/ask-leilia/admin/samples.astro");
  assert.match(page, /data-edit-toggle/);
  // Clicking Edit collapses all panels before opening the chosen one.
  assert.match(page, /\.rls-card__edit"\)\.forEach\(\(p\) => \(p\.hidden = true\)\)/);
});

run("successful draft save shows a clear confirmation", () => {
  const page = readSource("src/pages/ask-leilia/admin/samples.astro");
  assert.match(page, /Draft saved successfully/);
});

run("successful publication shows confirmation and a public URL", () => {
  const page = readSource("src/pages/ask-leilia/admin/samples.astro");
  assert.match(page, /Reading published successfully/);
  assert.match(page, /View published reading/);
  const api = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  assert.match(api, /viewUrl: sample\.isPublished \? getReadingLibraryPath\(sample\.slug\) : null/);
});

run("admin API performs no destructive writes (Hannah/Sasha are safe)", () => {
  const api = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  // No table deletes, no ad-hoc unpublish of other rows: only upsert by id/slug.
  assert.equal(/\.delete\(/.test(api), false, "API must not delete publications");
  assert.match(api, /id: existing\?\.id \?\? null/);
});

run("create is idempotent by slug (no duplicate on retry)", () => {
  const api = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  assert.match(api, /if \(isCreate\) \{[\s\S]*?getAuthorisedSampleBySlug\(service, preDraft\.slug\)/);
  assert.match(api, /if \(bySlug\) existing = bySlug;/);
  const queries = readSource("src/lib/readingLibrary/queries.ts");
  const fn = queries.slice(queries.indexOf("export async function getAuthorisedSampleBySlug"));
  assert.match(fn, /\.eq\("slug", slug\)/);
  assert.match(fn, /\.eq\("source_type", "authorised_sample"\)/);
});

// ---------------------------------------------------------------------------
// Reading type is restricted to the three valid Ask Leilia products.
// ---------------------------------------------------------------------------
run("only the three recognised reading types are offered in the form", () => {
  const form = readSource("src/components/ask-leilia/AuthorisedSampleForm.astro");
  // Rendered from the canonical allowlist, not free text or a hardcoded set.
  assert.match(form, /import \{ ASK_LEILIA_PUBLIC_READING_TYPE_LABELS \}/);
  assert.match(form, /<select name="sampleReadingType" required>/);
  assert.match(form, /ASK_LEILIA_PUBLIC_READING_TYPE_LABELS\.map/);
  // The invalid category is never offered.
  assert.equal(form.includes("Twelve-Month Reading"), false);
  assert.equal(form.includes("Twelve Month Reading"), false);

  const types = readSource("src/lib/ask-leilia/readingTypes.ts");
  // The public allowlist is derived from the three request products, in order.
  assert.match(
    types,
    /ASK_LEILIA_PUBLIC_READING_TYPE_LABELS: string\[\] = ASK_LEILIA_READING_TYPES\.map/,
  );
  assert.match(types, /export function isAskLeiliaPublicReadingTypeLabel/);
});

run("Personal Guidance Reading is accepted for a sample", () => {
  const result = validateAuthorisedSampleDraft(
    baseSampleDraft({ readingType: "Personal Guidance Reading" }),
  );
  assert.equal(result.ok, true);
});

run("Twelve-Month Reading is rejected with a clear allowlist message", () => {
  const result = validateAuthorisedSampleDraft(
    baseSampleDraft({ readingType: "Twelve-Month Reading" }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, "reading_type");
  // The real validator returns a specific, human-readable allowlist message and
  // enforces the same three-value allowlist server-side.
  const validation = readSource("src/lib/readingLibrary/validation.ts");
  assert.match(validation, /isAskLeiliaPublicReadingTypeLabel\(draft\.readingType\.trim\(\)\)/);
  assert.match(validation, /Reading type must be one of: \$\{ASK_LEILIA_PUBLIC_READING_TYPE_LABELS\.join\(", "\)\}/);
});

run("rejecting an unsupported reading type never clears or saves the record", () => {
  // Invalid drafts do not validate, so nothing is upserted.
  assert.equal(
    validateAuthorisedSampleDraft(baseSampleDraft({ readingType: "Twelve-Month Reading" })).ok,
    false,
  );
  // The failure travels the JSON error path (no redirect/reload), and the page
  // never resets the form, so entered values remain visible.
  const api = readSource("src/pages/api/ask-leilia/reading-library/samples/[id].ts");
  assert.match(api, /const validation = validateAuthorisedSampleDraft\(draft\);/);
  assert.match(api, /if \(!validation\.ok\) \{[\s\S]*?return failure\(request, validation\.error\)/);
  const page = readSource("src/pages/ask-leilia/admin/samples.astro");
  assert.equal(page.includes("form.reset()"), false);
});

run("Hannah/Sasha One Question Reading records remain valid", () => {
  // Draft and published One Question Reading samples still validate.
  assert.equal(
    validateAuthorisedSampleDraft(baseSampleDraft({ readingType: "One Question Reading" })).ok,
    true,
  );
  assert.equal(
    validateAuthorisedSampleDraft(
      baseSampleDraft({
        readingType: "One Question Reading",
        isPublished: true,
        samplePdfStoragePath: "reading-library-samples/x/y.pdf",
        consentConfirmedAt: "2026-07-10T00:00:00.000Z",
      }),
    ).ok,
    true,
  );
});

run("one-step Save and publish still works with a valid reading type", () => {
  const result = validateAuthorisedSampleDraft(
    baseSampleDraft({
      readingType: "Personal Guidance Reading",
      isPublished: true,
      samplePdfStoragePath: "reading-library-samples/x/y.pdf",
      consentConfirmedAt: "2026-07-10T00:00:00.000Z",
    }),
  );
  assert.equal(result.ok, true);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
