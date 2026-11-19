/**
 * Journal-specific response validation.
 * Kept separate from Card/Guidebook version-number responses.
 */
export type JournalJsonInterpretation =
  | {
      confirmed: true;
      outcome: "saved" | "unchanged";
      updated_at: string;
    }
  | {
      confirmed: false;
      message: string;
      conflict: boolean;
    };

export async function interpretJournalJsonSaveResponse(
  response: Response,
  expectedId: string,
  submittedUpdatedAt: string
): Promise<JournalJsonInterpretation> {
  const fail = (message: string, conflict = false): JournalJsonInterpretation =>
    ({ confirmed: false, message, conflict });

  if (response.redirected) {
    return fail("The Journal returned an unexpected redirect.");
  }

  if (!response.headers.get("content-type")?.toLowerCase()
    .includes("application/json")) {
    return fail("The Journal did not return a JSON acknowledgement.");
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return fail("The Journal acknowledgement could not be read.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail("The Journal returned an invalid acknowledgement.");
  }

  const result = body as Record<string, unknown>;

  if (response.status === 409) {
    return fail(
      typeof result.message === "string"
        ? result.message
        : "A newer saved Journal version exists.",
      true
    );
  }

  if (!response.ok) {
    return fail(
      typeof result.message === "string"
        ? result.message
        : "The Journal save could not be confirmed."
    );
  }

  if (response.status !== 200 ||
      result.id !== expectedId ||
      (result.outcome !== "saved" && result.outcome !== "unchanged") ||
      typeof result.updated_at !== "string") {
    return fail("The Journal did not confirm the correct saved record.");
  }

  const updatedAt = result.updated_at;
  const newTime = Date.parse(updatedAt);
  const oldTime = Date.parse(submittedUpdatedAt);

  if (!Number.isFinite(newTime) ||
      !Number.isFinite(oldTime) ||
      updatedAt.length < 10) {
    return fail("The Journal returned an invalid version timestamp.");
  }

  if (result.outcome === "unchanged") {
    if (updatedAt !== submittedUpdatedAt) {
      return fail("The unchanged Journal version does not match.");
    }
  } else if (newTime <= oldTime || updatedAt === submittedUpdatedAt) {
    return fail("The Journal did not confirm a newer saved version.");
  }

  return {
    confirmed: true,
    outcome: result.outcome,
    updated_at: updatedAt
  };
}
export type EditorialSaveResult =
  | { confirmed: true; outcome: "saved" | "unchanged"; version?: number; destination?: string }
  | { confirmed: false; message: string; conflict: boolean };

export async function interpretEditorialSaveResponse(
  response: Response,
  options:
    | { mode: "json"; expectedId: string; submittedVersion: number }
    | { mode: "redirect"; editorUrl: string; projectUrl: string }
): Promise<EditorialSaveResult> {
  const failed = (message: string, conflict = false): EditorialSaveResult =>
    ({ confirmed: false, message, conflict });

  if (options.mode === "json") {
    let result: {
      outcome?: string;
      message?: string;
      id?: string;
      version_number?: number;
    };

    try {
      result = await response.json();
    } catch {
      return failed("The server did not return a valid save confirmation.");
    }

    if (response.status === 409) {
      return failed(
        result.message ?? "A newer saved version exists. Your writing remains here.",
        true
      );
    }

    if (!response.ok) {
      return failed(result.message ?? "Save could not be confirmed.");
    }

    const valid =
      ["saved", "unchanged"].includes(result.outcome ?? "") &&
      result.id === options.expectedId &&
      Number.isSafeInteger(result.version_number) &&
      (result.outcome === "saved"
        ? result.version_number! > options.submittedVersion
        : result.version_number === options.submittedVersion);

    if (!valid) {
      return failed("The server did not confirm a valid saved version.");
    }

    return {
      confirmed: true,
      outcome: result.outcome as "saved" | "unchanged",
      version: result.version_number
    };
  }

  if (!response.ok || !response.redirected) {
    return failed("The Journal save was not confirmed. Your writing remains here.");
  }

  let destination: URL;
  let editor: URL;
  let project: URL;

  try {
    destination = new URL(response.url);
    editor = new URL(options.editorUrl);
    project = new URL(options.projectUrl);
  } catch {
    return failed("The Journal returned an invalid save destination.");
  }

  if (
    destination.origin !== editor.origin ||
    project.origin !== editor.origin
  ) {
    return failed("The Journal redirected outside the trusted Studio origin.");
  }

  const toEditor = destination.pathname === editor.pathname;
  const toProject = destination.pathname === project.pathname;

  if (!toEditor && !toProject) {
    return failed("The Journal returned an unexpected save destination.");
  }

  const error = destination.searchParams.get("error");

  if (error) return failed(error);

  const saved = toEditor
    ? destination.searchParams.get("saved") === "1"
    : destination.searchParams.get("editor_saved") === "1";

  const unchanged =
    destination.searchParams.get("unchanged") === "1";

  if (saved === unchanged) {
    return failed("The Journal did not return an unambiguous save confirmation.");
  }

  return {
    confirmed: true,
    outcome: saved ? "saved" : "unchanged",
    destination: destination.href
  };
}