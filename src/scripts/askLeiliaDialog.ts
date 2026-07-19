/**
 * Native <dialog showModal> with an in-page fallback for environments
 * that lack HTMLDialogElement modal methods. Never opens a separate browser window.
 */

type FallbackState = {
  escapeHandler: (event: KeyboardEvent) => void;
  previousOverflow: string;
};

const fallbackState = new WeakMap<HTMLDialogElement, FallbackState>();

export function supportsNativeModalDialog(dialog: HTMLDialogElement): boolean {
  return typeof dialog.showModal === "function" && typeof dialog.close === "function";
}

export function isAskLeiliaDialogOpen(dialog: HTMLDialogElement): boolean {
  if (supportsNativeModalDialog(dialog)) return dialog.open;
  return dialog.hasAttribute("open") && dialog.classList.contains("ask-leilia-dialog--fallback");
}

export function openAskLeiliaDialog(dialog: HTMLDialogElement): void {
  if (supportsNativeModalDialog(dialog)) {
    if (!dialog.open) dialog.showModal();
    return;
  }

  if (isAskLeiliaDialogOpen(dialog)) return;

  dialog.setAttribute("open", "");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.classList.add("ask-leilia-dialog--fallback");

  const previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";

  const escapeHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAskLeiliaDialog(dialog);
    }
  };
  document.addEventListener("keydown", escapeHandler);
  fallbackState.set(dialog, { escapeHandler, previousOverflow });
}

export function closeAskLeiliaDialog(dialog: HTMLDialogElement): void {
  if (supportsNativeModalDialog(dialog)) {
    if (dialog.open) dialog.close();
    return;
  }

  if (!dialog.hasAttribute("open") && !dialog.classList.contains("ask-leilia-dialog--fallback")) {
    return;
  }

  const state = fallbackState.get(dialog);
  if (state) {
    document.removeEventListener("keydown", state.escapeHandler);
    document.documentElement.style.overflow = state.previousOverflow;
    fallbackState.delete(dialog);
  }

  dialog.removeAttribute("open");
  dialog.removeAttribute("aria-modal");
  dialog.classList.remove("ask-leilia-dialog--fallback");
  dialog.dispatchEvent(new Event("close"));
}
