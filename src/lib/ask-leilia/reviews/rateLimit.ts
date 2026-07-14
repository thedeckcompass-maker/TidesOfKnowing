type RateBucket = { count: number; resetAt: number };

const buckets = new Map<string, RateBucket>();

/** Best-effort in-process rate limit (resets on isolate recycle). */
export function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return { allowed: true };
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "";
  return forwarded || "unknown";
}
