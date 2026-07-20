const DEFAULT_ENDPOINT = "/api/lead-magnet-signup/";

type LeadMagnetResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  code?: string;
  redirectUrl?: string;
};

function setStatus(form: HTMLFormElement, message: string, isError: boolean): void {
  const el = form.querySelector("[data-lead-magnet-status]");
  if (!(el instanceof HTMLElement)) return;
  el.hidden = false;
  el.textContent = message;
  el.classList.toggle("is-error", isError);
  el.classList.toggle("is-success", !isError);
}

function updateSourceComponent(form: HTMLFormElement): void {
  const sourceInput = form.querySelector<HTMLInputElement>('input[name="source_component"]');
  const root = form.closest<HTMLElement>("[data-lead-magnet-cta]");
  if (!sourceInput || !root) return;

  // Keep page-authored attribution (homepage, tools hub, COMPASS, series, etc.).
  if (sourceInput.dataset.sourceLocked === "1") return;

  const slug = form.querySelector<HTMLInputElement>('input[name="resourceSlug"]')?.value.trim();
  const placement = root.dataset.leadMagnetPlacement?.trim();
  if (slug && placement) {
    sourceInput.value = `lead-magnet-${slug}-${placement}`.slice(0, 200);
  }
}

export function initLeadMagnetSignup(root: Document | HTMLElement = document): void {
  const forms = root.querySelectorAll<HTMLFormElement>("[data-lead-magnet-form]");
  forms.forEach((form) => {
    if (form.dataset.leadMagnetBound === "1") return;
    form.dataset.leadMagnetBound = "1";
    updateSourceComponent(form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');
      const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
      const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');
      const resourceSlug = form.querySelector<HTMLInputElement>('input[name="resourceSlug"]');
      const sourceComponent = form.querySelector<HTMLInputElement>('input[name="source_component"]');
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

      const name = nameInput?.value.trim() ?? "";
      const email = emailInput?.value.trim() ?? "";

      if (!name) {
        setStatus(form, "Please enter your first name.", true);
        nameInput?.focus();
        return;
      }

      if (!email) {
        setStatus(form, "Please enter your email address.", true);
        emailInput?.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus(form, "Sending…", false);

      try {
        const res = await fetch(form.action || DEFAULT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            website: honeypot?.value ?? "",
            resourceSlug: resourceSlug?.value ?? "",
            source_component: sourceComponent?.value ?? "",
          }),
        });

        const data = (await res.json()) as LeadMagnetResponse;

        if (data.ok) {
          form.reset();
          setStatus(form, data.message ?? "Thanks. Your download is ready.", false);
          const redirectUrl = data.redirectUrl || form.dataset.redirectUrl;
          if (redirectUrl) {
            window.location.assign(redirectUrl);
          }
          return;
        }

        if (data.code === "not_configured") {
          setStatus(form, data.error ?? "This signup is not configured yet.", true);
          return;
        }

        setStatus(form, data.error ?? "Something went wrong. Please try again.", true);
      } catch {
        setStatus(form, "Network error. Please try again.", true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

export function hydrateLeadMagnetSlots(root: Document | HTMLElement = document): void {
  const slots = root.querySelectorAll<HTMLElement>("[data-lead-magnet-cta-slot]");
  slots.forEach((slot) => {
    if (slot.dataset.leadMagnetFilled === "1") return;
    const slug = slot.dataset.leadMagnetCtaSlot?.trim();
    if (!slug) return;

    const source = document.querySelector<HTMLElement>(
      `[data-lead-magnet-cta][data-resource-slug="${CSS.escape(slug)}"]`,
    );
    if (!source) return;

    const clone = source.cloneNode(true);
    if (!(clone instanceof HTMLElement)) return;

    clone.dataset.leadMagnetPlacement = slot.dataset.leadMagnetPlacement || "inline";
    clone.querySelectorAll("[data-lead-magnet-status]").forEach((status) => {
      if (status instanceof HTMLElement) {
        status.hidden = true;
        status.textContent = "";
        status.classList.remove("is-error", "is-success");
      }
    });
    clone.querySelectorAll<HTMLFormElement>("[data-lead-magnet-form]").forEach((form) => {
      delete form.dataset.leadMagnetBound;
      form.reset();
    });

    slot.replaceChildren(clone);
    slot.dataset.leadMagnetFilled = "1";
  });

  initLeadMagnetSignup(root);
}

if (typeof document !== "undefined") {
  const init = () => {
    hydrateLeadMagnetSlots();
    initLeadMagnetSignup();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
