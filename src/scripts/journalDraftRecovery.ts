/**
 * Journal-specific draft export.
 *
 * StudioDraftGuard remains responsible for discarded-draft
 * recovery and navigation protection.
 *
 * This module never submits, restores or changes form data.
 */
export function initJournalDraftRecovery(root: HTMLElement): void {
  if (root.dataset.recoveryReady === "1") return;

  const formId = root.dataset.formId;
  const ownerId = root.dataset.owner;
  const projectId = root.dataset.project;
  const entryId = root.dataset.entry ?? "new";

  const button = root.querySelector<HTMLButtonElement>(
    "[data-download-journal-draft]"
  );

  const status = root.querySelector<HTMLElement>(
    "[data-journal-recovery-status]"
  );

  const form = formId
    ? document.getElementById(formId)
    : null;

  if (
    !(form instanceof HTMLFormElement) ||
    !ownerId ||
    !projectId ||
    !button ||
    !status
  ) {
    if (status) {
      status.textContent =
        "Draft download is unavailable. Your writing has not been changed.";
    }
    return;
  }

  root.dataset.recoveryReady = "1";

  button.addEventListener("click", () => {
    try {
      const entries = Array.from(new FormData(form).entries())
        .filter(([name, value]) => {
          if (typeof value !== "string") return false;

          const element = Array.from(form.elements).find(
            field =>
              (field instanceof HTMLInputElement ||
               field instanceof HTMLTextAreaElement ||
               field instanceof HTMLSelectElement) &&
              field.name === name
          );

          if (!element) return false;

          if (
            element instanceof HTMLInputElement &&
            ["hidden", "password", "file"].includes(element.type)
          ) {
            return false;
          }

          return true;
        });

      const lines = [
        "Tides of Knowing | Private Journal Draft",
        "Downloaded: " + new Date().toISOString(),
        "This is a local writing copy, not a confirmed save.",
        "",
        ...entries.flatMap(([name, value]) => [
          name,
          String(value),
          ""
        ])
      ];

      const blob = new Blob([lines.join("\n")], {
        type: "text/plain;charset=utf-8"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const safeEntry = entryId.replace(/[^a-zA-Z0-9_-]/g, "_");

      link.href = url;
      link.download = `studio-journal-${safeEntry}-draft.txt`;
      link.hidden = true;

      document.body.append(link);

      try {
        link.click();
      } finally {
        link.remove();
        URL.revokeObjectURL(url);
      }

      status.textContent =
        "Journal draft download requested. Your current writing remains unchanged.";
    } catch {
      status.textContent =
        "The draft could not be downloaded. Your writing remains in the editor.";
    }
  });
}