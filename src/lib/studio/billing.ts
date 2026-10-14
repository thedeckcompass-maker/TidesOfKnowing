export const STUDIO_PLAN_CODES = ["studio", "circle", "private"] as const;
export type StudioPlanCode = (typeof STUDIO_PLAN_CODES)[number];
export type StudioAccessMode = "write" | "read_only" | "none";

export type StudioEntitlement = {
  user_id: string;
  plan_code: StudioPlanCode;
  status: string;
  access_mode: StudioAccessMode;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  read_only_until: string | null;
  paid_invoice_count: number;
  minimum_payments: number;
  onboarding_completed_at: string | null;
};

export const STUDIO_PLANS: Record<StudioPlanCode, {
  name: string;
  amountUsd: number;
  relationship: string;
  priceEnv: string;
  minimumPayments: number;
}> = {
  studio: {
    name: "Deck Creator Studio",
    amountUsd: 197,
    relationship: "Self-directed creation with one requested monthly Project Pulse.",
    priceEnv: "STUDIO_STRIPE_TEST_PRICE_STUDIO",
    minimumPayments: 1,
  },
  circle: {
    name: "Guided Deck Circle",
    amountUsd: 597,
    relationship: "A twelve-week commitment with weekly small-group guidance.",
    priceEnv: "STUDIO_STRIPE_TEST_PRICE_CIRCLE",
    minimumPayments: 3,
  },
  private: {
    name: "Private Deck Partnership",
    amountUsd: 1495,
    relationship: "Weekly private guidance and proactive editorial oversight.",
    priceEnv: "STUDIO_STRIPE_TEST_PRICE_PRIVATE",
    minimumPayments: 1,
  },
};

type RuntimeLocals = { runtime?: { env?: Record<string, string | undefined> } };

export function studioEnv(name: string, locals?: unknown): string {
  const runtimeValue = (locals as RuntimeLocals | undefined)?.runtime?.env?.[name];
  return runtimeValue ?? (import.meta.env[name] as string | undefined) ?? "";
}

export function studioStripeTestConfig(locals?: unknown) {
  const secretKey = studioEnv("STUDIO_STRIPE_TEST_SECRET_KEY", locals);
  const webhookSecret = studioEnv("STUDIO_STRIPE_TEST_WEBHOOK_SECRET", locals);
  const portalConfiguration = studioEnv("STUDIO_STRIPE_TEST_PORTAL_CONFIGURATION", locals);
  const parsedRetentionDays = Number(studioEnv("STUDIO_READ_ONLY_RETENTION_DAYS", locals) || "30");
  const readOnlyRetentionDays = Number.isFinite(parsedRetentionDays) && parsedRetentionDays >= 0 ? Math.floor(parsedRetentionDays) : 30;
  const prices = Object.fromEntries(
    STUDIO_PLAN_CODES.map((code) => [code, studioEnv(STUDIO_PLANS[code].priceEnv, locals)]),
  ) as Record<StudioPlanCode, string>;
  return { secretKey, webhookSecret, portalConfiguration, readOnlyRetentionDays, prices };
}

export function isStudioPlanCode(value: unknown): value is StudioPlanCode {
  return typeof value === "string" && STUDIO_PLAN_CODES.includes(value as StudioPlanCode);
}

export function assertStripeTestMode(secretKey: string): void {
  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("Deck Creator Studio billing requires a Stripe test-mode secret key.");
  }
}

export function entitlementAllowsRead(entitlement: StudioEntitlement | null | undefined): boolean {
  if (!entitlement || entitlement.access_mode === "none") return false;
  if (entitlement.access_mode === "write") return true;
  if (!entitlement.read_only_until) return true;
  return new Date(entitlement.read_only_until).getTime() > Date.now();
}

export function entitlementAllowsWrite(entitlement: StudioEntitlement | null | undefined): boolean {
  return entitlement?.access_mode === "write" && ["active", "trialing", "manual"].includes(entitlement.status);
}

export function accessModeForSubscriptionStatus(status: string): StudioAccessMode {
  return ["active", "trialing"].includes(status) ? "write" : ["past_due", "unpaid", "canceled"].includes(status) ? "read_only" : "none";
}

export function entitlementStatusForSubscription(status: string): StudioEntitlement["status"] {
  if (["trialing", "active", "past_due", "unpaid", "canceled", "incomplete"].includes(status)) return status;
  return "expired";
}
