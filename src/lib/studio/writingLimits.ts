/** Shared by editor and server; never truncate manuscript input. */
export function writingLimitError(form: FormData, limits: Record<string, number>): string | null {
  for (const [key, limit] of Object.entries(limits)) {
    const value = form.get(key);
    if (typeof value === "string" && value.replace(/\r\n/g, "\n").length > limit) {
      const label = key === "body_markdown" ? "Manuscript" : key.replaceAll("_", " ");
      return `${label} exceeds ${limit.toLocaleString("en-US")} characters. Nothing was saved or shortened. Your text is still in the editor; copy it somewhere safe, then split it into smaller sections or fields before saving.`;
    }
  }
  return null;
}

/** A script-free submission must retain its full writing in the response, too. */
export function writingRecoveryResponse(form: FormData, error: string): Response | null {
  if (!error.includes("Nothing was saved or shortened.")) return null;
  const writing = Array.from(form.entries()).filter(([key, value]) => typeof value === "string" && !key.endsWith("_id") && key !== "expected_current_version")
    .map(([key, value]) => `${key.replaceAll("_", " ")}\n\n${value}`).join("\n\n———\n\n");
  return new Response(`Your writing was not saved. No existing version was changed.\n\nCopy your full writing below somewhere safe before returning to the editor. Split it into smaller sections or fields before saving again.\n\n${error.split(" Your text is still")[0]}\n\n${writing}`, {
    status: 400,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
