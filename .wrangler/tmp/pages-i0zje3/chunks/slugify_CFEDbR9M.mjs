globalThis.process ??= {}; globalThis.process.env ??= {};
function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

export { slugify as s };
