/** Match existing form normalization without changing stored source on a no-op. */
export function canonicalWriting(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/\r\n/g, "\n").trim();
  if (Array.isArray(value)) return value.map(canonicalWriting);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonicalWriting(item)]));
  return value;
}
export function sameWriting(a: unknown, b: unknown): boolean { return JSON.stringify(canonicalWriting(a)) === JSON.stringify(canonicalWriting(b)); }
/** Existing project-save routes acknowledge a message and database timestamp.
 * Reject malformed/older acknowledgements before clearing a browser draft. */
export function acknowledgedProjectTimestamp(value:any,previous:string):string{
 const next=value?.updatedAt;
 if(typeof value?.message!=='string'||typeof next!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(next)||!Number.isFinite(Date.parse(next))||!Number.isFinite(Date.parse(previous))||Date.parse(next)<Date.parse(previous))throw Error('The saved project version could not be confirmed. Keep your draft and check the saved record before retrying.');
 return next;
}
