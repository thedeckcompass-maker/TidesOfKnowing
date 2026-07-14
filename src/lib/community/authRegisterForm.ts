import {
  createAuthOtpSubmissionId,
  normalizeAuthOtpSubmissionId,
} from "./authOtpSubmissionId";

export type AuthRegisterFormOptions = {
  cardSelector: string;
  defaultButtonText?: string;
  confirmedClass: string;
  /** Minimum ms before a deliberate second send after success reset. */
  resendCooldownMs?: number;
};

export const AUTH_OTP_RESEND_COOLDOWN_MS = 60_000;
export const AUTH_OTP_SENDING_BUTTON_TEXT = "Sending sign-in link...";
export const AUTH_OTP_SENDING_STATUS_MESSAGE =
  "Please wait while we prepare your secure sign-in link.";
export const AUTH_OTP_ERROR_MESSAGE =
  "Unable to send a sign-in link right now. Please try again.";

export function ensureAuthOtpSubmissionField(form: HTMLFormElement): string {
  let field = form.querySelector<HTMLInputElement>('input[name="submissionId"]');
  if (!(field instanceof HTMLInputElement)) {
    field = document.createElement("input");
    field.type = "hidden";
    field.name = "submissionId";
    form.prepend(field);
  }

  const existing = normalizeAuthOtpSubmissionId(field.value);
  if (existing) {
    field.value = existing;
    return existing;
  }

  const created = createAuthOtpSubmissionId();
  field.value = created;
  return created;
}

/** Issue a new UUID for a deliberate later attempt (after cooldown). */
export function rotateAuthOtpSubmissionField(form: HTMLFormElement): string {
  let field = form.querySelector<HTMLInputElement>('input[name="submissionId"]');
  if (!(field instanceof HTMLInputElement)) {
    return ensureAuthOtpSubmissionField(form);
  }
  const next = createAuthOtpSubmissionId();
  field.value = next;
  return next;
}

/**
 * Reuse the form’s existing UUID for this request. Do not mint a different id
 * for the same intentional submission.
 */
export function readAuthOtpSubmissionIdForRequest(form: HTMLFormElement): string {
  return ensureAuthOtpSubmissionField(form);
}

export function bindAuthRegisterForms(options: AuthRegisterFormOptions) {
  const resendCooldownMs = options.resendCooldownMs ?? AUTH_OTP_RESEND_COOLDOWN_MS;
  const forms = document.querySelectorAll("[data-auth-register-form]");

  forms.forEach((node) => {
    if (!(node instanceof HTMLFormElement) || node.dataset.submitBound === "true") return;

    const form = node;
    form.dataset.submitBound = "true";
    ensureAuthOtpSubmissionField(form);

    let submitted = false;
    let lastSuccessAt = 0;
    let activeSubmissionId: string | null = null;
    const originalAction = form.getAttribute("action") || window.location.pathname;
    const submitButton = form.querySelector("[data-auth-register-submit]");
    const statusMessage = form.querySelector("[data-auth-register-status]");
    const entry = form.closest("[data-auth-entry]");
    const card = form.closest(options.cardSelector);
    const confirmation = card?.querySelector("[data-auth-confirmation]");
    const secondaryContent = document.querySelectorAll("[data-auth-secondary]");
    const confirmationEmail = confirmation?.querySelector("[data-auth-confirmation-email]");
    const resetButton = confirmation?.querySelector("[data-auth-reset]");
    const defaultButtonText =
      (submitButton instanceof HTMLButtonElement && submitButton.dataset.defaultText) ||
      options.defaultButtonText ||
      "Continue";

    function setStatus(text: string, visible: boolean) {
      if (!(statusMessage instanceof HTMLElement)) return;
      statusMessage.hidden = !visible;
      statusMessage.textContent = text;
    }

    function setSending(isSending: boolean) {
      if (!(submitButton instanceof HTMLButtonElement)) return;
      submitButton.disabled = isSending;
      submitButton.textContent = isSending
        ? submitButton.dataset.sendingText || AUTH_OTP_SENDING_BUTTON_TEXT
        : defaultButtonText;
    }

    function showConfirmation(email: string) {
      lastSuccessAt = Date.now();
      activeSubmissionId = null;
      rotateAuthOtpSubmissionField(form);

      if (confirmation instanceof HTMLElement) {
        if (confirmationEmail instanceof HTMLElement) confirmationEmail.textContent = email;
        card?.classList.add(options.confirmedClass);
        if (entry instanceof HTMLElement) entry.hidden = true;
        confirmation.hidden = false;
        secondaryContent.forEach((content) => {
          if (content instanceof HTMLElement) content.hidden = true;
        });
        return;
      }

      setStatus("Check your email for your secure sign-in link.", true);
      setSending(false);
      submitted = false;
    }

    function restoreForm() {
      const elapsed = Date.now() - lastSuccessAt;
      if (lastSuccessAt > 0 && elapsed < resendCooldownMs) {
        const waitSec = Math.ceil((resendCooldownMs - elapsed) / 1000);
        setStatus(`Please wait ${waitSec}s before requesting another link.`, true);
        return;
      }

      if (submitted && activeSubmissionId) {
        setStatus(AUTH_OTP_SENDING_STATUS_MESSAGE, true);
        return;
      }

      submitted = false;
      activeSubmissionId = null;
      rotateAuthOtpSubmissionField(form);
      card?.classList.remove(options.confirmedClass);
      if (entry instanceof HTMLElement) entry.hidden = false;
      if (confirmation instanceof HTMLElement) confirmation.hidden = true;
      secondaryContent.forEach((content) => {
        if (content instanceof HTMLElement) content.hidden = false;
      });
      setSending(false);
      setStatus(AUTH_OTP_SENDING_STATUS_MESSAGE, false);
    }

    resetButton?.addEventListener("click", restoreForm);

    form.addEventListener("submit", async (event) => {
      if (submitted) {
        event.preventDefault();
        return;
      }

      const cooldownElapsed = Date.now() - lastSuccessAt;
      if (lastSuccessAt > 0 && cooldownElapsed < resendCooldownMs) {
        event.preventDefault();
        const waitSec = Math.ceil((resendCooldownMs - cooldownElapsed) / 1000);
        setStatus(`Please wait ${waitSec}s before requesting another link.`, true);
        return;
      }

      if (!form.checkValidity()) return;

      event.preventDefault();
      submitted = true;

      const correlationId = readAuthOtpSubmissionIdForRequest(form);
      activeSubmissionId = correlationId;

      setSending(true);
      setStatus(AUTH_OTP_SENDING_STATUS_MESSAGE, true);

      const formData = new FormData(form);
      formData.set("submissionId", correlationId);
      const email = String(formData.get("email") || "").trim();

      try {
        const response = await fetch(originalAction, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "text/html",
            "X-Auth-Submission-Id": correlationId,
          },
          credentials: "same-origin",
          redirect: "manual",
        });

        if (
          response.status === 303 ||
          response.status === 302 ||
          response.status === 301 ||
          response.status === 307 ||
          response.status === 308
        ) {
          const locationHeader = response.headers.get("Location") || "";
          let nextPath = "";
          try {
            nextPath = new URL(locationHeader, window.location.origin).pathname;
          } catch {
            nextPath = "";
          }

          if (nextPath === "/auth/check-email/") {
            showConfirmation(email);
            setStatus("", false);
            return;
          }

          if (locationHeader) {
            window.location.assign(locationHeader);
            return;
          }
        }

        if (response.redirected) {
          const responseUrl = new URL(response.url);
          if (responseUrl.pathname === "/auth/check-email/") {
            showConfirmation(email);
            setStatus("", false);
            return;
          }
          window.location.assign(response.url);
          return;
        }

        lastSuccessAt = Date.now();
        setStatus(AUTH_OTP_ERROR_MESSAGE, true);
      } catch (_error) {
        lastSuccessAt = Date.now();
        setStatus(AUTH_OTP_ERROR_MESSAGE, true);
      } finally {
        if (card?.classList.contains(options.confirmedClass)) {
          activeSubmissionId = null;
        } else if (!submitted) {
          // Inline confirmation already unlocked.
        } else {
          setSending(true);
          window.setTimeout(() => {
            if (activeSubmissionId === correlationId) {
              submitted = false;
              activeSubmissionId = null;
              rotateAuthOtpSubmissionField(form);
              setSending(false);
              setStatus(
                "If no email arrives, you can request another link. Please wait a full minute between requests.",
                true,
              );
            }
          }, resendCooldownMs);
        }
      }
    });
  });
}
