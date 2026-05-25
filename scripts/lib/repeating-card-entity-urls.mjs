/**
 * Canonical repeating-card entity URLs (78 pages).
 * Source of truth for tracker CSV and GSC analysis scripts.
 */
import fs from "node:fs";
import path from "node:path";
import {
  CONTENT_ROOT,
  SITE_ORIGIN,
  SUIT_FOLDERS,
  expectedCanonicalUrl,
  slugFromCollectionId,
} from "./repeating-card-metadata-core.mjs";

const CORE_SECTION = "## Core Repeating Message";
const MIN_BODY_CHARS = 400;

function isReadyBody(body) {
  const trimmed = body?.trim() ?? "";
  return trimmed.length >= MIN_BODY_CHARS && trimmed.includes(CORE_SECTION);
}

function parseReadyFlag(raw, body) {
  const match = raw.match(/^ready:\s*(true|false)\s*$/m);
  if (match) return match[1] === "true";
  return isReadyBody(body);
}

/** @returns {{ collectionId: string, slug: string, suit: string, entityUrl: string }[]} */
export function listRepeatingCardEntities() {
  const entities = [];

  for (const suit of SUIT_FOLDERS) {
    const dir = path.join(CONTENT_ROOT, suit);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const collectionId = `${suit}/${file.replace(/\.md$/, "")}`;
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const body = raw.replace(/^---[\s\S]*?---\n?/, "");
      if (!parseReadyFlag(raw, body)) continue;

      const slug = slugFromCollectionId(collectionId);
      entities.push({
        collectionId,
        slug,
        suit,
        entityUrl: expectedCanonicalUrl(slug),
      });
    }
  }

  entities.sort((a, b) => a.entityUrl.localeCompare(b.entityUrl));
  return entities;
}

export function entityUrlPattern() {
  return new RegExp(
    `^${SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/repeating-card-meanings/[^/]+/?$`,
    "i",
  );
}

export function toolDeepLinkPattern() {
  return new RegExp(
    `^${SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/tools/repeating-card-meanings/.+`,
    "i",
  );
}
