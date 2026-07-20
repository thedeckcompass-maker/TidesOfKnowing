/**
 * COMPASS cohort selection + enrolment form interactivity.
 * Progressive month → cohort → enrol panel; disables submit until valid.
 */
export function initCompassEnrolForm(root: HTMLElement): void {
  const monthButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-compass-month]")];
  const monthPanels = [...root.querySelectorAll<HTMLElement>("[data-compass-month-panel]")];
  const cohortInputs = [...root.querySelectorAll<HTMLInputElement>('input[name="cohortId"]')];
  const form = root.querySelector<HTMLFormElement>("[data-compass-enrol-form]");
  const enrolPanel = root.querySelector<HTMLElement>("[data-compass-enrol-panel]");
  const summary = root.querySelector<HTMLElement>("[data-compass-summary]");
  const attendLabel = root.querySelector<HTMLElement>("[data-compass-attend-label]");
  const sessionDatesInput = root.querySelector<HTMLInputElement>('input[name="sessionDates"]');
  const submitBtn = root.querySelector<HTMLButtonElement>('[data-compass-submit]');
  const firstName = root.querySelector<HTMLInputElement>('input[name="firstName"]');
  const lastName = root.querySelector<HTMLInputElement>('input[name="lastName"]');
  const email = root.querySelector<HTMLInputElement>('input[name="email"]');
  const attend = root.querySelector<HTMLInputElement>('input[name="attendConfirmed"]');
  const terms = root.querySelector<HTMLInputElement>('input[name="termsAccepted"]');
  const formError = root.querySelector<HTMLElement>("[data-compass-form-error]");

  if (!form || !submitBtn || !sessionDatesInput) return;

  function selectedCohortInput(): HTMLInputElement | undefined {
    return cohortInputs.find((input) => input.checked && !input.disabled);
  }

  function showMonth(monthKey: string): void {
    for (const btn of monthButtons) {
      const active = btn.dataset.compassMonth === monthKey;
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.classList.toggle("is-active", active);
    }
    for (const panel of monthPanels) {
      const active = panel.dataset.compassMonthPanel === monthKey;
      panel.hidden = !active;
    }
  }

  function updateSummary(): void {
    const input = selectedCohortInput();
    if (!input || !summary || !enrolPanel) {
      if (enrolPanel) enrolPanel.hidden = true;
      return;
    }

    const label = input.dataset.cohortLabel ?? "";
    const start = input.dataset.startLabel ?? "";
    const further = input.dataset.furtherLabel ?? "";
    const datesJson = input.dataset.sessionDates ?? "[]";

    sessionDatesInput!.value = datesJson;

    summary.innerHTML = `
      <p class="compass-enrol__summary-label">${escapeHtml(label)}</p>
      <p class="compass-enrol__summary-start"><strong>Starts ${escapeHtml(start)}</strong></p>
      <p class="compass-enrol__summary-time">7:00–8:30 pm Mexico City time (CST / UTC−6)</p>
      <p class="compass-enrol__summary-further">Further teaching sessions: ${escapeHtml(further)}</p>
    `;

    if (attendLabel) {
      attendLabel.textContent = `I can attend the cohort beginning ${start} and have reviewed the three further teaching dates shown above.`;
    }

    enrolPanel.hidden = false;
    updateSubmitState();
  }

  function fieldsValid(): boolean {
    const cohortOk = Boolean(selectedCohortInput());
    const nameOk = Boolean(firstName?.value.trim()) && Boolean(lastName?.value.trim());
    const emailOk = Boolean(email?.value.trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email!.value.trim());
    const checksOk = Boolean(attend?.checked) && Boolean(terms?.checked);
    return cohortOk && nameOk && emailOk && checksOk;
  }

  function updateSubmitState(): void {
    submitBtn!.disabled = !fieldsValid();
  }

  function escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  for (const btn of monthButtons) {
    btn.addEventListener("click", () => {
      const key = btn.dataset.compassMonth;
      if (key) showMonth(key);
    });
  }

  for (const input of cohortInputs) {
    input.addEventListener("change", () => {
      if (attend) attend.checked = false;
      updateSummary();
    });
  }

  for (const el of [firstName, lastName, email, attend, terms]) {
    el?.addEventListener("input", updateSubmitState);
    el?.addEventListener("change", updateSubmitState);
  }

  form.addEventListener("submit", (event) => {
    if (!fieldsValid()) {
      event.preventDefault();
      if (formError) {
        formError.hidden = false;
        formError.textContent = "Please complete all required fields and confirmations before continuing.";
      }
      return;
    }
    submitBtn!.disabled = true;
    submitBtn!.textContent = "Redirecting to payment…";
  });

  const initialMonth =
    monthButtons.find((b) => b.getAttribute("aria-selected") === "true")?.dataset.compassMonth ??
    monthButtons[0]?.dataset.compassMonth;
  if (initialMonth) showMonth(initialMonth);

  updateSummary();
  updateSubmitState();
}
