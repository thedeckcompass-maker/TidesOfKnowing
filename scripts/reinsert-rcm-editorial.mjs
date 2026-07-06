#!/usr/bin/env node

/**

 * Orchestrated Repeating Card Meanings editorial reinsertion.

 *

 * 1. Global integrity audit (pre)

 * 2. Editorial Reinsertion Contract validation

 * 3. Archive current production (never overwrites prior versions)

 * 4. Copy Claude working copy to production

 * 5. Global integrity audit (post)

 * 6. Clear .astro cache, sync content store, build site

 *

 * Usage:

 *   node scripts/reinsert-rcm-editorial.mjs \

 *     --contract editorial/repeating-card-library/contracts/majors/the-fool.yaml

 *

 * Dry run (audit + validate only, no production write or build):

 *   node scripts/reinsert-rcm-editorial.mjs --contract ... --dry-run
 *
 * If contract validation fails (dry run or full run): STOP immediately.
 * Do not archive, write production, build, or auto-repair the Claude working copy.
 * Report structural mismatches and wait for explicit owner approval before any fix.

 */



import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";

import { join, dirname, isAbsolute } from "node:path";

import { fileURLToPath } from "node:url";

import { spawnSync } from "node:child_process";



const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ASTRO_CACHE = join(REPO_ROOT, ".astro");



function runNode(scriptRelPath, scriptArgs = [], label) {

  const result = spawnSync(

    process.execPath,

    [join(REPO_ROOT, scriptRelPath), ...scriptArgs],

    { stdio: "inherit", cwd: REPO_ROOT },

  );

  if (result.status !== 0) {

    console.error(`BLOCKED: ${label} failed.`);

    process.exit(1);

  }

}



function loadContract(contractPath) {

  const text = readFileSync(contractPath, "utf8");

  const contract = { collection_id: null, production_target: null };

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



function claudePathFromCollectionId(collectionId) {

  const [suit, slug] = collectionId.split("/");

  return join(

    REPO_ROOT,

    "editorial/repeating-card-library/claude",

    suit,

    `${slug}.md`,

  );

}



function clearAstroCacheAndBuild() {

  if (existsSync(ASTRO_CACHE)) {

    rmSync(ASTRO_CACHE, { recursive: true, force: true });

    console.log("Cleared .astro content cache.");

  }



  const sync = spawnSync("npx", ["astro", "sync"], {
    stdio: "inherit",
    cwd: REPO_ROOT,
    shell: true,
  });
  if (sync.status !== 0) {
    console.error("BLOCKED: astro sync failed.");
    process.exit(1);
  }

  const build = spawnSync("npm", ["run", "build"], {

    stdio: "inherit",

    cwd: REPO_ROOT,

    shell: true,

  });

  if (build.status !== 0) {

    console.error("BLOCKED: npm run build failed.");

    process.exit(1);

  }

}



const args = process.argv.slice(2);

const dryRun = args.includes("--dry-run");

const contractIdx = args.indexOf("--contract");

const contractPath =

  contractIdx >= 0 ? args[contractIdx + 1] : null;



if (!contractPath) {

  console.error(

    "Usage: node scripts/reinsert-rcm-editorial.mjs --contract <contract.yaml> [--dry-run]",

  );

  process.exit(2);

}



const contract = loadContract(

  isAbsolute(contractPath) ? contractPath : join(REPO_ROOT, contractPath),

);

const claudePath = claudePathFromCollectionId(contract.collection_id);

const productionPath = join(REPO_ROOT, contract.production_target);



if (!existsSync(claudePath)) {

  console.error(`BLOCKED: Claude working copy not found: ${claudePath}`);

  process.exit(1);

}



// Step 0: Pre-reinsertion integrity audit

runNode("scripts/audit-rcm-integrity.mjs", [], "Pre-reinsertion integrity audit");



// Step 1: Contract validation

runNode(

  "scripts/validate-rcm-editorial-reinsertion.mjs",

  ["--contract", contractPath, claudePath],

  "Contract validation",

);



if (dryRun) {

  console.log(

    "DRY RUN: Pre-audit and contract validation passed. Production not modified.",

  );

  process.exit(0);

}



// Validation failure exits non-zero before this point — no archive, production write, or build.

// Step 2: Archive current production before any write

runNode(

  "scripts/archive-rcm-production-version.mjs",

  ["--contract", contractPath],

  "Archive step",

);



// Step 3: Copy Claude working copy to production

const rewritten = readFileSync(claudePath, "utf8");

writeFileSync(productionPath, rewritten, "utf8");



console.log("REINSERTED: Production updated.");

console.log(`Collection: ${contract.collection_id}`);

console.log(`Production: ${productionPath}`);



// Step 4: Post-reinsertion integrity audit

runNode("scripts/audit-rcm-integrity.mjs", [], "Post-reinsertion integrity audit");



// Step 5: Clear cache, sync, build

clearAstroCacheAndBuild();



console.log("COMPLETE: Reinsertion workflow finished (audit, archive, production, build).");

console.log("Next: spot-check entity + tool URLs, update progress tracker, git commit.");


