globalThis.process ??= {}; globalThis.process.env ??= {};
function estimateReadingMinutes(markdown) {
  const stripped = markdown.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]+\)/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#>*_`|\[\]()]/g, " ");
  const words = stripped.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export { estimateReadingMinutes as e };
