/**
 * /subscribe/ landing: persist attribution query keys in sessionStorage (best-effort;
 * values are hints only, not trusted). Optionally prefill the MailerLite email field from
 * `?email=` when the embed exposes a normal email input. Does not touch segmentation fields.
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

const POLL_MS = 400;
const MAX_WAIT_MS = 30_000;

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
  try {
    const selectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="fields[email]"]',
      'input[autocomplete="email"]',
    ];
    for (const sel of selectors) {
      const found = root.querySelectorAll(sel);
      for (const el of found) {
        if (!(el instanceof HTMLInputElement) || el.disabled) continue;
        if (el.value && el.value.trim() !== "") continue;
        el.value = email;
        return true;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
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

  const started = Date.now();
  let filled = false;
  const id = window.setInterval(() => {
    if (filled || Date.now() - started > MAX_WAIT_MS) {
      window.clearInterval(id);
      return;
    }
    const root = document.querySelector(".tok-subscribe__form-wrap");
    if (!(root instanceof HTMLElement)) return;
    filled = tryPrefillEmail(root, emailFromUrl);
    if (filled) window.clearInterval(id);
  }, POLL_MS);
}
