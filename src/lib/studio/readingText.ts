/** Read-only formatting. Never pass this projection to an UPDATE or backup data file. */
export function isLegacyBirdManuscript(snapshot: Record<string, any>): boolean {
  return snapshot.metadata?.custom?.aotearoa_bird_oracle?.namespace === "aotearoa_bird_oracle";
}
export function legacyReadingMarkdown(value: string): string {
  let fence = "";
  return value.replace(/\r\n/g, "\n").split("\n").map(line => {
    const marker = line.trimStart().match(/^(`{3,}|~{3,})/)?.[1];
    if (marker) { if (!fence) fence = marker[0]; else if (fence === marker[0]) fence = ""; return line; }
    // Recovered Word-layout prose uses very large indentation. Ordinary Markdown
    // code (4 spaces) and fenced writing remain verbatim, as does saved source.
    return !fence ? line.replace(/^ {16,}(?=\S)/, "") : line;
  }).join("\n");
}
export function readingManuscript(section: Record<string, any>): string {
  return isLegacyBirdManuscript(section) ? legacyReadingMarkdown(section.body_markdown ?? "") : section.body_markdown ?? "";
}
export function rightsReadingText(value: string): string {
  const meanings: Record<string,string> = { not_sourced: "Not sourced yet", tbd: "To be decided", not_addressed: "Permissions not reviewed yet", pending: "Pending", sourced: "Sourced", cleared: "Cleared" };
  return value.split(/\r?\n/).filter(line => line.trim()).map(line => {
    const match = line.match(/^(Status|Source|Rights|Credit|Type):\s*(.*)$/);
    return match ? `${match[1]}: ${meanings[match[2]] ?? match[2]}` : line;
  }).join("\n\n");
}
