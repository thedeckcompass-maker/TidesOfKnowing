/** Approximate word count from markdown source (code fences stripped). */
export function countWords(markdown: string): number {
  const stripped = markdown.replace(/```[\s\S]*?```/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}
