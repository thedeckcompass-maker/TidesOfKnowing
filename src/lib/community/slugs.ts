import { slugify } from "../../utils/slugify";

export function communityPostPath(slug: string): string {
  return `/community/${slug}/`;
}

export function communitySectionPath(sectionKey: string): string {
  return `/community/sections/${sectionKey}/`;
}

export function createPostSlug(title: string): string {
  const base = slugify(title).slice(0, 72).replace(/-+$/g, "") || "practice-note";
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${base}-${suffix}`;
}
