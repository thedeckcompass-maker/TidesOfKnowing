#!/usr/bin/env node
/**
 * Verify Reading Library implementation files are present in the current HEAD tree.
 * Guards against accidental loss of commit f47fe94 work.
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED_PATHS = [
  "supabase/migrations/20260706200000_reading_library_publications.sql",
  "src/lib/readingLibrary/index.ts",
  "src/lib/readingLibrary/types.ts",
  "src/lib/readingLibrary/queries.ts",
  "src/lib/readingLibrary/validation.ts",
  "src/pages/api/ask-leilia/reading-library/[requestId].ts",
  "src/pages/api/reading-library/[slug]/pdf.ts",
  "src/pages/recent-client-readings/index.astro",
  "src/pages/recent-client-readings/[slug].astro",
  "src/pages/ask-leilia/admin.astro",
  "src/components/recent-client-readings/RecentClientReadingCard.astro",
  "src/components/recent-client-readings/RecentClientReadingContinueExploring.astro",
  "src/components/recent-client-readings/RecentClientReadingFeaturedSpread.astro",
  "src/components/recent-client-readings/RecentClientReadingGrid.astro",
  "src/components/recent-client-readings/RecentClientReadingMetaPanel.astro",
  "src/components/recent-client-readings/RecentClientReadingSpreadGallery.astro",
  "src/styles/recent-client-readings.css",
];

function git(args) {
  return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function gitOk(args) {
  try {
    execSync(`git ${args}`, { cwd: REPO_ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const errors = [];
  const head = git("rev-parse HEAD");

  if (!gitOk("merge-base --is-ancestor f47fe94 HEAD")) {
    errors.push("Commit f47fe94 is not an ancestor of HEAD.");
  }

  const tracked = new Set(
    git(`ls-tree -r --name-only HEAD -- ${REQUIRED_PATHS.join(" ")}`)
      .split("\n")
      .filter(Boolean),
  );

  for (const relPath of REQUIRED_PATHS) {
    if (!tracked.has(relPath)) {
      errors.push(`Missing in HEAD: ${relPath}`);
    }
  }

  const placeholderTracked = git(
    "ls-tree -r --name-only HEAD -- src/content/recent-client-readings/",
  )
    .split("\n")
    .filter(Boolean);

  if (placeholderTracked.length > 0) {
    errors.push(
      `Placeholder markdown should be deleted in HEAD but found: ${placeholderTracked.join(", ")}`,
    );
  }

  if (errors.length > 0) {
    console.error("FAIL: Reading Library HEAD verification failed.\n");
    for (const message of errors) {
      console.error(`  - ${message}`);
    }
    process.exit(1);
  }

  console.log("PASS: Reading Library files verified in HEAD.");
  console.log(`  HEAD: ${head}`);
  console.log(`  Required paths: ${REQUIRED_PATHS.length}`);
  console.log("  Placeholder markdown: none (intentionally deleted)");
}

main();
