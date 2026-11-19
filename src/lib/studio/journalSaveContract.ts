/**
 * A confirmed acknowledgement applies to the exact
 * writing snapshot submitted to the server.
 *
 * Current editor contents may already have changed.
 */
/**
 * Authoritative acknowledgement returned by the Journal API
 * for asynchronous saves.
 *
 * The server supplies updated_at from the persisted record.
 */
export type JournalJsonSaveAcknowledgement = {
  outcome: "saved" | "unchanged";
  id: string;
  updated_at: string;
};
export type JournalSaveResult =
  | {
      confirmed: true;
      outcome: "saved" | "unchanged";
      destination: string;
      submittedSnapshot: string;
      acknowledgedSnapshot: string;
      acknowledgedValues: [string, string][];
      submissionSequence: number;
      newerEditsRemain: boolean;
    }
  | {
      confirmed: false;
      message: string;
      newerEditsRemain: true;
    };

export type JournalSaveRequest = {
  continuing?: boolean;
};

export type JournalSaveHandler = (
  request?: JournalSaveRequest
) => Promise<JournalSaveResult>;

/**
 * Capture only editable Journal fields.
 * Use the existing canonicalWriting normalization.
 * Hidden identity, entitlement and concurrency fields are excluded.
 */
import { canonicalWriting } from "./saveState";

export function journalWritingSnapshot(form: HTMLFormElement): string {
  const data = new FormData(form);

  const fields = {
    title: String(data.get("title") ?? ""),
    entry_kind: String(data.get("entry_kind") ?? ""),
    linked_card_id: String(data.get("linked_card_id") ?? ""),
    linked_section_id: String(data.get("linked_section_id") ?? ""),
    tags: data.getAll("tags")
      .filter((value): value is string => typeof value === "string")
      .sort(),
    body_markdown: String(data.get("body_markdown") ?? ""),
    selected_for_process: data.get("selected_for_process") !== null
  };

  return JSON.stringify(canonicalWriting(fields));
}