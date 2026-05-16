/**
 * /subscribe/ landing: persist attribution query keys in sessionStorage (best-effort;
 * values are hints only, not trusted). Prefills the first-party email field from `?email=`.
 */

const STORAGE_PREFIX = "tok_nl_attr_";
const PARAM_KEYS = [
  "source_path",
  "source_component",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

function safeStore(key: string, value: string, maxLen: number): void {
  try {
    sessionStorage.setItem(key, value.slice(0, maxLen));
  } catch {
    /* quota or privacy mode */
  }
}

function storeParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const sp = new URLSearchParams(window.location.search);
    for (const key of PARAM_KEYS) {
      const v = sp.get(key)?.trim();
      if (v) safeStore(STORAGE_PREFIX + key, v, 2000);
    }
    const email = sp.get("email")?.trim();
    if (email) safeStore(STORAGE_PREFIX + "email", email, 320);
  } catch {
    /* ignore */
  }
}

function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function tryPrefillEmail(root: HTMLElement, email: string): boolean {
  if (!isPlausibleEmail(email)) return false;
  const el = root.querySelector<HTMLInputElement>('input[type="email"][name="email"]');
  if (!el || el.disabled || (el.value && el.value.trim() !== "")) return false;
  el.value = email;
  return true;
}

export function initSubscribePageAttribution(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  storeParamsFromUrl();

  let emailFromUrl = "";
  try {
    emailFromUrl = new URLSearchParams(window.location.search).get("email")?.trim() ?? "";
  } catch {
    return;
  }
  if (!emailFromUrl || !isPlausibleEmail(emailFromUrl)) return;

  const root = document.querySelector(".tok-subscribe__form-wrap");
  if (root instanceof HTMLElement) {
    tryPrefillEmail(root, emailFromUrl);
  }
}
