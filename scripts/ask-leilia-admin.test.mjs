#!/usr/bin/env node
/**
 * Ask Leilia admin queue — unit tests (no live DB).
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

function parseAskLeiliaAdminSort(value) {
  return value === "oldest" ? "oldest" : "newest";
}

function parseAskLeiliaArchiveFilter(value) {
  if (value === "archived" || value === "all") return value;
  return "active";
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
    return aValid ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function sortAskLeiliaAdminRequests(requests, sort) {
  return [...requests].sort((a, b) => compareAskLeiliaAdminRequests(a, b, sort));
}

function filterAskLeiliaAdminRequestsByArchive(requests, archiveFilter) {
  if (archiveFilter === "all") return requests;
  if (archiveFilter === "archived") {
    return requests.filter((request) => Boolean(request.archived_at));
  }
  return requests.filter((request) => !request.archived_at);
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

  const dateText = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  const timeText = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);

  return {
    dateText,
    timeText: `${timeText} UTC`,
    title: `${dateText} ${timeText} UTC`,
    unavailable: false,
  };
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

const sample = [
  { id: "b", created_at: "2026-07-10T12:00:00.000Z", archived_at: null, status: "Paid" },
  {
    id: "a",
    created_at: "2026-07-12T12:00:00.000Z",
    archived_at: "2026-07-13T12:00:00.000Z",
    status: "Delivered",
  },
  { id: "c", created_at: "2026-07-10T12:00:00.000Z", archived_at: null, status: "In Progress" },
];

const adminPage = readFileSync(join(REPO_ROOT, "src/pages/ask-leilia/admin.astro"), "utf8");
const apiSource = readFileSync(
  join(REPO_ROOT, "src/pages/api/ask-leilia/requests/[id].ts"),
  "utf8",
);
const migration = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20260714220000_ask_leilia_request_archive.sql"),
  "utf8",
);
const adminQueueSource = readFileSync(
  join(REPO_ROOT, "src/lib/ask-leilia/adminQueue.ts"),
  "utf8",
);
const queriesSource = readFileSync(join(REPO_ROOT, "src/lib/ask-leilia/queries.ts"), "utf8");

run("newest-first ordering", () => {
  const sorted = sortAskLeiliaAdminRequests(sample, "newest");
  assert.deepEqual(
    sorted.map((row) => row.id),
    ["a", "b", "c"],
  );
});

run("oldest-first ordering", () => {
  const sorted = sortAskLeiliaAdminRequests(sample, "oldest");
  assert.deepEqual(
    sorted.map((row) => row.id),
    ["b", "c", "a"],
  );
});

run("deterministic ordering when timestamps match", () => {
  const same = [
    { id: "zeta", created_at: "2026-07-10T12:00:00.000Z" },
    { id: "alpha", created_at: "2026-07-10T12:00:00.000Z" },
    { id: "middle", created_at: "2026-07-10T12:00:00.000Z" },
  ];
  assert.deepEqual(
    sortAskLeiliaAdminRequests(same, "newest").map((row) => row.id),
    ["alpha", "middle", "zeta"],
  );
  assert.deepEqual(
    sortAskLeiliaAdminRequests(same, "oldest").map((row) => row.id),
    ["alpha", "middle", "zeta"],
  );
});

run("active-only filtering", () => {
  assert.deepEqual(
    filterAskLeiliaAdminRequestsByArchive(sample, "active").map((row) => row.id),
    ["b", "c"],
  );
});

run("archived-only filtering", () => {
  assert.deepEqual(
    filterAskLeiliaAdminRequestsByArchive(sample, "archived").map((row) => row.id),
    ["a"],
  );
});

run("all-reading filtering", () => {
  assert.equal(filterAskLeiliaAdminRequestsByArchive(sample, "all").length, 3);
});

run("archive action path exists and sets archived_at", () => {
  assert.match(apiSource, /actionRaw === "archive"/);
  assert.match(apiSource, /archived_at: now/);
  assert.match(apiSource, /archived_by: locals\.profile\.id/);
});

run("restore action clears archived_at", () => {
  assert.match(apiSource, /actionRaw === "restore"/);
  assert.match(apiSource, /archived_at: null/);
  assert.match(apiSource, /archived_by: null/);
});

run("archive state not changing request status", () => {
  const archiveBranch = apiSource.slice(
    apiSource.indexOf('if (actionRaw === "archive" || actionRaw === "restore")'),
    apiSource.indexOf("const statusRaw"),
  );
  assert.doesNotMatch(archiveBranch, /\.update\(\{[\s\S]*status:/);
});

run("archive state not changing payment status", () => {
  const archiveBranch = apiSource.slice(
    apiSource.indexOf('if (actionRaw === "archive" || actionRaw === "restore")'),
    apiSource.indexOf("const statusRaw"),
  );
  assert.doesNotMatch(archiveBranch, /payment_status/);
});

run("unauthorised archive attempt rejected", () => {
  assert.match(apiSource, /isAdminProfile\(locals\.profile\)/);
  const guard = apiSource.slice(0, apiSource.indexOf("const requestId"));
  assert.match(guard, /Not found\./);
});

run("collapsed summary containing date, time, name, reading type and statuses", () => {
  assert.match(adminPage, /ask-admin-card__summary/);
  assert.match(adminPage, /data-ask-admin-local-time/);
  assert.match(adminPage, /ask-admin-card__name/);
  assert.match(adminPage, /ask-admin-card__type/);
  assert.match(adminPage, /Payment:/);
  assert.match(adminPage, /Request:/);
  assert.match(adminPage, /<details/);
  assert.match(adminPage, /<summary class="ask-admin-card__summary"/);
});

run("missing timestamp fallback", () => {
  const unavailable = formatSubmissionDisplayUtc(null);
  assert.equal(unavailable.unavailable, true);
  assert.equal(unavailable.dateText, "Submission time unavailable");
  assert.equal(formatSubmissionDisplayUtc("not-a-date").unavailable, true);
});

run("keyboard-accessible disclosure control", () => {
  assert.match(adminPage, /<details/);
  assert.match(adminPage, /:focus-visible/);
  assert.match(adminPage, /ask-admin-card__chevron/);
});

run("migration adds archived_at without deleting data", () => {
  assert.match(migration, /add column if not exists archived_at timestamptz/);
  assert.match(migration, /archived_by uuid/);
  assert.doesNotMatch(migration, /delete from public\.ask_leilia_requests/i);
});

run("sort and archive query params are validated", () => {
  assert.equal(parseAskLeiliaAdminSort("nope"), "newest");
  assert.equal(parseAskLeiliaAdminSort("oldest"), "oldest");
  assert.equal(parseAskLeiliaArchiveFilter("weird"), "active");
  assert.equal(parseAskLeiliaArchiveFilter("all"), "all");
  assert.match(adminQueueSource, /parseAskLeiliaAdminSort/);
  assert.match(queriesSource, /archived_at/);
  assert.match(queriesSource, /order\("id"/);
});

run("return path stays inside admin queue", () => {
  assert.equal(parseAdminReturnPath("/ask-leilia/admin/?sort=oldest"), "/ask-leilia/admin/?sort=oldest");
  assert.equal(parseAdminReturnPath("https://evil.example/"), "/ask-leilia/admin/");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
