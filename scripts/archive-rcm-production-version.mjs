#!/usr/bin/env node
/**
 * Archive the current production markdown for a Repeating Card Meanings card
 * immediately before a production reinsertion.
 *
 * Independent of Git. Never overwrites existing archive versions.
 *
 * Usage:
 *   node scripts/archive-rcm-production-version.mjs --contract contracts/majors/the-fool.yaml
 *   node scripts/archive-rcm-production-version.mjs --collection-id majors/the-fool
 *
 * Version rules:
 *   v1-original.md   — seeded at pipeline setup (untouched production before first rewrite)
 *   v2-editorial.md  — production snapshot before first reinsertion
 *   v3-editorial.md  — production snapshot before second reinsertion
 *   …
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  console.error(`Usage:
  node scripts/archive-rcm-production-version.mjs --contract <contract.yaml>
  node scripts/archive-rcm-production-version.mjs --collection-id <suit/slug>`);
}

function loadContract(contractPath) {
  const text = readFileSync(contractPath, "utf8");
  const contract = {
    collection_id: null,
    production_target: null,
  };
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("collection_id:")) {
      contract.collection_id = line
        .slice("collection_id:".length)
        .trim()
        .replace(/^["']|["']$/g, "");
    } else if (line.startsWith("production_target:")) {
      contract.production_target = line
        .slice("production_target:".length)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return contract;
}

function parseArgs(argv) {
  let contractPath = null;
  let collectionId = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--contract") contractPath = argv[++i];
    else if (argv[i] === "--collection-id") collectionId = argv[++i];
  }

  if (contractPath) {
    const contract = loadContract(
      isAbsolute(contractPath) ? contractPath : join(REPO_ROOT, contractPath),
    );
    return {
      collectionId: contract.collection_id,
      productionPath: join(REPO_ROOT, contract.production_target),
      contractPath,
    };
  }

  if (collectionId) {
    const [suit, slug] = collectionId.split("/");
    return {
      collectionId,
      productionPath: join(
        REPO_ROOT,
        "src/content/repeating-card-meanings",
        suit,
        `${slug}.md`,
      ),
    };
  }

  return { error: "Missing --contract or --collection-id" };
}

function listArchiveVersions(archiveDir) {
  if (!existsSync(archiveDir)) return [];
  return readdirSync(archiveDir)
    .filter((f) => /^v\d+-(original|editorial)\.md$/.test(f))
    .map((f) => {
      const match = f.match(/^v(\d+)-(original|editorial)\.md$/);
      return { version: Number.parseInt(match[1], 10), filename: f };
    })
    .sort((a, b) => a.version - b.version);
}

function nextArchiveFilename(archiveDir) {
  const versions = listArchiveVersions(archiveDir);
  const maxVersion = versions.reduce((max, v) => Math.max(max, v.version), 0);

  if (maxVersion === 0) {
    return { filename: "v1-original.md", version: 1, isSeed: true };
  }

  const next = maxVersion + 1;
  return { filename: `v${next}-editorial.md`, version: next, isSeed: false };
}

function archiveProduction({ collectionId, productionPath }) {
  if (!existsSync(productionPath)) {
    throw new Error(`Production file not found: ${productionPath}`);
  }

  const [suit, slug] = collectionId.split("/");
  const archiveDir = join(
    REPO_ROOT,
    "editorial/repeating-card-library/archive",
    suit,
    slug,
  );

  mkdirSync(archiveDir, { recursive: true });

  const { filename, version, isSeed } = nextArchiveFilename(archiveDir);
  const destPath = join(archiveDir, filename);

  if (existsSync(destPath)) {
    throw new Error(
      `Archive version already exists (refusing to overwrite): ${destPath}`,
    );
  }

  const content = readFileSync(productionPath, "utf8");
  writeFileSync(destPath, content, "utf8");

  return { archiveDir, destPath, filename, version, isSeed, productionPath };
}

const args = parseArgs(process.argv.slice(2));
if (args.error) {
  usage();
  console.error(args.error);
  process.exit(2);
}

try {
  const result = archiveProduction(args);
  console.log("ARCHIVED: Production snapshot saved before reinsertion.");
  console.log(`Collection: ${args.collectionId}`);
  console.log(`Source: ${result.productionPath}`);
  console.log(`Archive: ${result.destPath}`);
  console.log(`Version: ${result.filename}`);
  if (result.isSeed) {
    console.log("Note: v1-original created (no prior archive existed for this card).");
  } else {
    console.log("Previous versions preserved. This version is immutable.");
  }
} catch (err) {
  console.error(`BLOCKED: ${err.message}`);
  process.exit(1);
}
