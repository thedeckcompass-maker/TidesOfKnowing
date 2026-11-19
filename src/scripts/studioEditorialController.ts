import {registerStudioDraft} from './studioDraftGuard';
import { journalWritingSnapshot } from "../lib/studio/journalSaveContract";
import type { JournalSaveHandler, JournalSaveResult } from "../lib/studio/journalSaveContract";

import { interpretEditorialSaveResponse, interpretJournalJsonSaveResponse } from "../lib/studio/editorialSaveResponse";

  export function initStudioEditorialController(): void {
for (const form of document.querySelectorAll<HTMLFormElement>(
    'form[data-studio-versioned-save]'
  )) {
    const feedback = form.querySelector<HTMLElement>(
      '[data-studio-save-feedback]'
    ) ?? document.querySelector<HTMLElement>(`[data-studio-save-feedback-for="${form.id}"]`);
    const version = form.querySelector<HTMLInputElement>(
      'input[name="expected_current_version"]'
    );
    const submit = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );

    if (!feedback || !version || !submit || form.dataset.studioEditorialReady==='true') continue;
    form.dataset.studioEditorialReady='true';

    let saving = false;
    const writingSnapshot = (data: FormData) =>
      JSON.stringify([...data.entries()].filter(([key]) =>
        key !== "expected_current_version"
      ));
    let savedSnapshot = writingSnapshot(new FormData(form));
    let dirty = false;
    const refreshDirty = () => {
      dirty = writingSnapshot(new FormData(form)) !== savedSnapshot;
    };

    const announce = (message: string, error = false) => {
      feedback.textContent = message;
      feedback.hidden = false;
      feedback.setAttribute("role", error ? "alert" : "status");
    };

    const protectedFields = new Set([
      "project_id",
      "expected_current_version"
    ]);

    const draftKey = `studio-recovery:${form.dataset.creatorId}:${location.pathname}:${form.id}`;

    const retainedDraftKey = `${draftKey}:retained`;
    const comparisonDraftKey = `${draftKey}:comparison`;
    const preComparisonDraftKey = `${draftKey}:pre-comparison`;

    const recoverableFields = () =>
      [...new FormData(form).entries()].filter(
        ([key]) => !protectedFields.has(key)
      );

    const persistDraft = () => {
      try {
        if (!dirty) {
          sessionStorage.removeItem(draftKey);
          return;
        }

        sessionStorage.setItem(
          draftKey,
          JSON.stringify({
            at: new Date().toISOString(),
            fields: recoverableFields()
          })
        );
      } catch {
        announce("Browser recovery storage is unavailable. Keep this page open until your writing is saved.", true);
      }
    };

    const recoverDraft = () => {
      try {
        const raw = sessionStorage.getItem(draftKey);
        if (!raw) return;

        const saved = JSON.parse(raw);

        if (!Array.isArray(saved.fields)) return;

        const shouldRecover = window.confirm(
          "Unsaved writing from this browser tab is available. Recover it into this editor? Your current saved version will not be changed."
        );

        if (!shouldRecover) {
          if (sessionStorage.getItem(retainedDraftKey) === null) {
            sessionStorage.setItem(retainedDraftKey, raw);
          }
          sessionStorage.removeItem(draftKey);
          announce("The earlier recovery copy has been retained separately. New editing will not overwrite it.");
          return;
        }

        const editable = new Map(
          [...form.elements]
            .filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
              (element instanceof HTMLInputElement ||
               element instanceof HTMLTextAreaElement ||
               element instanceof HTMLSelectElement) &&
              element.type !== "hidden" &&
              Boolean(element.name) &&
              !protectedFields.has(element.name)
            )
            .map(element => [element.name, element])
        );

        const proposed = new Map<string, string>();
        for (const entry of saved.fields) {
          if (!Array.isArray(entry) || entry.length !== 2) continue;
          const [key, value] = entry;
          if (typeof key !== "string" || typeof value !== "string") continue;
          if (!editable.has(key)) continue;
          proposed.set(key, value);
        }

        for (const [key, value] of proposed) {
          const field = editable.get(key)!;
          field.value = value;
        }

        refreshDirty();
        if (dirty) persistDraft();
        announce("Recovered writing loaded for review against the current version. No database record has changed.");
      } catch {
        announce("The saved browser draft could not be recovered. Your current editor remains unchanged.", true);
      }
    };
    recoverDraft();

    const retainedControl = document.createElement("button");
    retainedControl.type = "button";
    retainedControl.className = "studio-button studio-button--secondary";
    retainedControl.textContent = "Review retained writing";
    retainedControl.hidden = true;
    form.append(retainedControl);

    const refreshRetainedControl = () => {
      try {
        retainedControl.hidden = sessionStorage.getItem(retainedDraftKey) === null;
      } catch {
        retainedControl.hidden = true;
      }
    };

    retainedControl.addEventListener("click", () => {
      try {
        const raw = sessionStorage.getItem(retainedDraftKey);
        if (!raw) return;

        const retained = JSON.parse(raw);
        if (!Array.isArray(retained.fields)) {
          announce("This retained copy cannot be opened safely.", true);
          return;
        }

        if (!window.confirm(
          "Open retained writing? Your current unsaved writing will be preserved separately before the retained copy is loaded."
        )) return;

        const editable = new Map(
          [...form.elements]
            .filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
              (element instanceof HTMLInputElement ||
               element instanceof HTMLTextAreaElement ||
               element instanceof HTMLSelectElement) &&
              element.type !== "hidden" &&
              Boolean(element.name) &&
              !protectedFields.has(element.name)
            )
            .map(element => [element.name, element])
        );

        const currentFields = recoverableFields();
        const currentCopy = JSON.stringify({
          at: new Date().toISOString(),
          fields: currentFields
        });

        const existingActive = sessionStorage.getItem(draftKey);
        if (existingActive !== null) {
          announce("An active draft already exists. Review or save it before opening retained writing.", true);
          return;
        }

        if (sessionStorage.getItem(comparisonDraftKey) !== null) {
          announce("An earlier comparison copy is already preserved. Review it before opening another retained draft.", true);
          return;
        }

        sessionStorage.setItem(comparisonDraftKey, currentCopy);
        sessionStorage.setItem(draftKey, currentCopy);

        for (const entry of retained.fields) {
          if (!Array.isArray(entry) || entry.length !== 2) continue;
          const [key, value] = entry;
          if (typeof key !== "string" || typeof value !== "string") continue;
          const field = editable.get(key);
          if (field) field.value = value;
        }

        refreshDirty();
        announce("Retained writing opened for comparison. Your previous editor contents are preserved in the active recovery copy. Nothing has been saved.");
      } catch {
        announce("Retained writing could not be opened. Your current editor remains available.", true);
      }
    });

    refreshRetainedControl();

    const comparisonControl = document.createElement("button");
    comparisonControl.type = "button";
    comparisonControl.className = "studio-button studio-button--secondary";
    comparisonControl.textContent = "Review previous writing";
    form.append(comparisonControl);

    const refreshComparisonControl = () => {
      try {
        comparisonControl.hidden = sessionStorage.getItem(comparisonDraftKey) === null;
      } catch {
        comparisonControl.hidden = true;
      }
    };

    comparisonControl.addEventListener("click", () => {
      try {
        const raw = sessionStorage.getItem(comparisonDraftKey);
        if (!raw) return;

        const copy = JSON.parse(raw);
        if (!Array.isArray(copy.fields)) {
          announce("The previous writing copy cannot be opened safely.", true);
          return;
        }

        if (!window.confirm(
          "Review previous writing? Your current editor text will remain protected before the comparison copy opens."
        )) return;

        const active = sessionStorage.getItem(draftKey);
        if (active !== null) {
          announce("An active draft is already preserved. Review or save that draft before changing the editor to another copy.", true);
          return;
        }

        const currentCopy = JSON.stringify({
          at: new Date().toISOString(),
          fields: recoverableFields()
        });

        if (sessionStorage.getItem(preComparisonDraftKey) !== null) {
          announce("An earlier pre-comparison copy is already protected. Review it before opening another comparison.", true);
          return;
        }

        sessionStorage.setItem(preComparisonDraftKey, currentCopy);
        sessionStorage.setItem(draftKey, currentCopy);

        const editable = new Map(
          [...form.elements]
            .filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
              (element instanceof HTMLInputElement ||
               element instanceof HTMLTextAreaElement ||
               element instanceof HTMLSelectElement) &&
              element.type !== "hidden" &&
              Boolean(element.name) &&
              !protectedFields.has(element.name)
            )
            .map(element => [element.name, element])
        );

        for (const entry of copy.fields) {
          if (!Array.isArray(entry) || entry.length !== 2) continue;
          const [key, value] = entry;
          if (typeof key !== "string" || typeof value !== "string") continue;
          const field = editable.get(key);
          if (field) field.value = value;
        }

        refreshDirty();
        announce("Previous writing opened for comparison. Your current draft remains preserved. Nothing has been saved.");
      } catch {
        announce("The comparison copy could not be opened. Your current editor remains available.", true);
      }
    });

    refreshComparisonControl();

    const preComparisonControl = document.createElement("button");
    preComparisonControl.type = "button";
    preComparisonControl.className = "studio-button studio-button--secondary";
    preComparisonControl.textContent = "Review pre-comparison writing";
    form.append(preComparisonControl);

    const refreshPreComparisonControl = () => {
      try {
        preComparisonControl.hidden =
          sessionStorage.getItem(preComparisonDraftKey) === null;
      } catch {
        preComparisonControl.hidden = true;
      }
    };

    preComparisonControl.addEventListener("click", () => {
      try {
        const raw = sessionStorage.getItem(preComparisonDraftKey);
        if (!raw) return;

        const copy = JSON.parse(raw);
        if (!Array.isArray(copy.fields)) {
          announce("The protected writing copy cannot be displayed safely.", true);
          return;
        }

        const allowed = new Set(
          [...form.elements]
            .filter(element =>
              (element instanceof HTMLInputElement ||
               element instanceof HTMLTextAreaElement ||
               element instanceof HTMLSelectElement) &&
              element.type !== "hidden" &&
              Boolean(element.name) &&
              !protectedFields.has(element.name)
            )
            .map(element => (element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).name)
        );

        const lines: string[] = [];
        for (const entry of copy.fields) {
          if (!Array.isArray(entry) || entry.length !== 2) continue;
          const [key, value] = entry;
          if (typeof key !== "string" || typeof value !== "string") continue;
          if (!allowed.has(key)) continue;
          lines.push(`${key}\n${value}`);
        }

        const dialog = document.createElement("dialog");
        dialog.setAttribute("aria-label", "Protected previous writing");

        const heading = document.createElement("h2");
        heading.textContent = "Protected previous writing";

        const manuscript = document.createElement("pre");
        manuscript.textContent = lines.join("\n\n");
        manuscript.style.whiteSpace = "pre-wrap";
        manuscript.style.overflowWrap = "anywhere";
        manuscript.style.maxHeight = "60vh";
        manuscript.style.overflow = "auto";

        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "Close";
        close.addEventListener("click", () => dialog.close());

        dialog.addEventListener("close", () => dialog.remove());
        dialog.append(heading, manuscript, close);
        document.body.append(dialog);
        dialog.showModal();
      } catch {
        announce("Protected previous writing could not be displayed. The editor has not been changed.", true);
      }
    });

    refreshPreComparisonControl();

    form.addEventListener("input", () => { refreshDirty(); persistDraft(); });
    form.addEventListener("change", () => { refreshDirty(); persistDraft(); });

    window.addEventListener("beforeunload", (event) => {
      if (dirty && !saving) event.preventDefault();
    });

    const performSave = async ():Promise<boolean> => {
      if (saving || !form.reportValidity()) return false;

      saving = true;
      submit.disabled = true;
      form.setAttribute("aria-busy", "true");

      const submitted = new FormData(form);
      const submittedSnapshot = writingSnapshot(submitted);
      const submittedVersion = version.value;
      const expectedId = decodeURIComponent(
        new URL(form.action).pathname.split("/").filter(Boolean).pop() ?? ""
      );
      announce("Saving your writing…");

      try {
        const response = await fetch(form.action, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(20000),
          body: submitted,
        });

        const result = await interpretEditorialSaveResponse(response, {
          mode: "json",
          expectedId,
          submittedVersion: Number(submittedVersion)
        });

        if (!result.confirmed) {
          announce(result.message, true);
          return false;
        }
        version.value = String(result.version);

        if (result.outcome === "saved") {
          announce(
            `Writing saved successfully as version ${result.version}.`
          );
        } else {
          announce(
            `No changes required. Current version ${result.version}.`
          );
        }

        savedSnapshot = submittedSnapshot;
        refreshDirty();
        persistDraft();
        if (dirty) {
          announce(
            "The submitted version was saved, but newer edits remain unsaved."
          );
        } else {
          document.dispatchEvent(new CustomEvent("studio-writing-saved", {
            detail: { formId: form.id }
          }));
        }
        return !dirty;
      } catch {
        announce(
          "The save could not be confirmed. Your writing is still in this editor. Check the current saved version before retrying.",
          true
        );
        return false;
      } finally {
        saving = false;
        submit.disabled = false;
        form.removeAttribute("aria-busy");
      }
    };
    let pendingSave:Promise<boolean>|null=null;
    const save=()=>{if(pendingSave)return pendingSave;pendingSave=performSave().finally(()=>{pendingSave=null});return pendingSave;};
    form.addEventListener('submit',event=>{event.preventDefault();void save();});
    const applyFields=(fields:unknown)=>{if(!Array.isArray(fields))throw Error('Invalid writing recovery');for(const element of Array.from(form.elements)){if(!(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement||element instanceof HTMLSelectElement)||!element.name||protectedFields.has(element.name)||element.type==='hidden')continue;const matches=fields.filter(item=>Array.isArray(item)&&item[0]===element.name&&typeof item[1]==='string');if(element instanceof HTMLInputElement&&['checkbox','radio'].includes(element.type))element.checked=matches.some(item=>item[1]===element.value);else if(matches.length)element.value=matches[0][1];}refreshDirty();persistDraft();};
    registerStudioDraft({root:form,key:draftKey+':guard',label:form.action.includes('/cards/')?'card writing':'Guidebook writing',destination:'the current versioned creative record',fields:'input:not([type=hidden]),textarea,select',priority:10,
     dirty:()=>{refreshDirty();return dirty;},save,
     snapshot:()=>({fields:recoverableFields(),version:version.value}),
     restore:value=>{if(!value||!Array.isArray(value.fields)||!/^\d+$/.test(String(value.version)))throw Error('Invalid recovered writing');applyFields(value.fields);version.value=String(value.version);},
     discard:()=>{applyFields(JSON.parse(savedSnapshot));announce('Unsaved writing discarded. Saved records and version history are unchanged.');},message:()=>feedback.textContent??''});

  }

}

/**
 * Journal editing integration.
 * Submission ownership will move here after the existing
 * save-bar reminder and navigation behaviour is separated.
 */

export function initStudioJournalEditorialController():
  JournalSaveHandler | null {
  const form = document.getElementById("studio-journal-editor");
  if (!(form instanceof HTMLFormElement)) return null;

  const version = form.querySelector<HTMLInputElement>(
    'input[name="expected_updated_at"]'
  );
  if (!version) return null;

  let pending = false;
  let submissionSequence = 0;
  let acknowledgedSequence = 0;

  return async (): Promise<JournalSaveResult> => {
    const failed = (message: string): JournalSaveResult => ({
      confirmed: false,
      message,
      newerEditsRemain: true
    });

    if (pending) return failed("A save is already in progress.");
    if (!form.reportValidity()) {
      return failed("Complete the required fields before saving.");
    }

    const submitted = new FormData(form);
    const submittedSnapshot = journalWritingSnapshot(form);
    const acknowledgedValues = [...submitted.entries()]
      .filter(([name, value]) =>
        typeof value === "string" &&
        !["project_id", "entry_id", "expected_updated_at",
          "return_to_project"].includes(name)
      ) as [string, string][];
    const sequence = ++submissionSequence;
    const projectId = String(submitted.get("project_id") ?? "");

    if (!/^[a-f0-9-]{36}$/i.test(projectId)) {
      return failed("The Journal project identity is invalid.");
    }

    pending = true;
    const abort = new AbortController();
    let expired = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const response = await Promise.race([
        fetch(form.action, {
          method: "POST",
          body: submitted,
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: abort.signal
        }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            expired = true;
            abort.abort();
            reject(new Error("JOURNAL_SAVE_TIMEOUT"));
          }, 30000);
        })
      ]);

      if (expired) throw new Error("JOURNAL_SAVE_TIMEOUT");

      const entryId = new URL(form.action).pathname
        .match(/\/api\/studio\/journal\/([a-f0-9-]{36})\/?$/i)?.[1];

      if (!entryId) {
        return failed("The Journal entry identity is invalid.");
      }

      const submittedUpdatedAt =
        String(submitted.get("expected_updated_at") ?? "");

      const result = await interpretJournalJsonSaveResponse(
        response,
        entryId,
        submittedUpdatedAt
      );

      if (!result.confirmed) return failed(result.message);

      if (sequence <= acknowledgedSequence) {
        return failed("An older save acknowledgement was received.");
      }

      // Only the confirmed version token is advanced.
      // No visible writing field is replaced.
      version.value = result.updated_at;
      acknowledgedSequence = sequence;

      const returning = submitted.get("return_to_project") === "on";
      const pathname = returning
        ? `/studio/projects/${projectId}/`
        : `/studio/projects/${projectId}/journal/${entryId}/`;
      const destination = new URL(pathname, location.origin);
      destination.searchParams.set(
        result.outcome === "unchanged"
          ? "unchanged"
          : returning ? "editor_saved" : "saved",
        "1"
      );

      // The server has confirmed this submission.
      // It has not necessarily confirmed newer editor changes.
      const acknowledgedSnapshot = submittedSnapshot;
      const newerEditsRemain =
        journalWritingSnapshot(form) !== acknowledgedSnapshot;

      return {
        confirmed: true,
        outcome: result.outcome,
        destination: destination.href,
        submittedSnapshot,
        acknowledgedSnapshot,
        acknowledgedValues,
        submissionSequence: sequence,
        newerEditsRemain
      };
    } catch (error) {
      if (expired || (error instanceof Error &&
          error.message === "JOURNAL_SAVE_TIMEOUT")) {
        return failed(
          "The save timed out and cannot be confirmed. Your writing remains here. Check the latest saved version before retrying."
        );
      }
      return failed(
        "The save could not be confirmed. Your writing remains here. Check the latest saved version before retrying."
      );
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      pending = false;
    }
  };
}
