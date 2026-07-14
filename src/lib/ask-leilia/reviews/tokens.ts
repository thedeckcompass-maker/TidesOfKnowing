import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;

export function generateAskLeiliaReviewToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashAskLeiliaReviewToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokensMatch(provided: string, expectedHash: string): boolean {
  const providedHash = hashAskLeiliaReviewToken(provided);
  const a = Buffer.from(providedHash, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
