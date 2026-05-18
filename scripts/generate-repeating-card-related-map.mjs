/**
 * Syncs governed related-card data from YAML into TypeScript for build-time imports.
 * Source of truth: src/data/related-card-map.yaml
 */
import fs from "node:fs";
import {
  formatRelatedCardMapTs,
  readRelatedCardMapYaml,
  TS_PATH,
} from "./lib/repeating-card-related-map-core.mjs";

const doc = readRelatedCardMapYaml();
fs.writeFileSync(TS_PATH, formatRelatedCardMapTs(doc));
console.log(`Wrote ${TS_PATH} (${Object.keys(doc).length} cards)`);
