import { ARTICLE_AUDIO_SLUGS } from "../generated/articleAudioSlugs";

export type ArticleAudioInput = {
  slug: string;
  frontmatterAudio?: {
    src?: string;
    duration?: string;
    transcript?: string;
  };
};

export type ArticleAudioResult = {
  src: string;
  duration?: string;
  transcript?: string;
} | null;

/** Reject path segments that could escape `public/audio/articles/`. */
function isSafeArticleSlug(slug: string): boolean {
  if (!slug || slug.trim() === "") return false;
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) return false;
  return true;
}

function trimOpt(s: string | undefined): string | undefined {
  const t = s?.trim();
  if (t == null || t === "") return undefined;
  return t;
}

/** Slugs with `public/audio/articles/[slug]/article.mp3` at last build (see prebuild script). */
function hasDefaultAudioInManifest(slug: string): boolean {
  return isSafeArticleSlug(slug) && ARTICLE_AUDIO_SLUGS.includes(slug);
}

/**
 * Resolves author-read audio for an article at build/render time.
 *
 * - If `frontmatterAudio.src` is set, it wins (with optional duration/transcript from frontmatter).
 * - Else, if that file was present when the manifest was generated (`npm run build` / `prebuild`), uses the default URL.
 * - Optional frontmatter `duration` / `transcript` apply to either source.
 * - Auto-discovery of `transcript.md` is deferred (no URL until a route exists).
 */
export function getArticleAudio({
  slug,
  frontmatterAudio,
}: ArticleAudioInput): ArticleAudioResult {
  const fmSrc = trimOpt(frontmatterAudio?.src);

  if (fmSrc) {
    return {
      src: fmSrc,
      duration: trimOpt(frontmatterAudio?.duration),
      transcript: trimOpt(frontmatterAudio?.transcript),
    };
  }

  if (!hasDefaultAudioInManifest(slug)) {
    return null;
  }

  return {
    src: `/audio/articles/${slug}/article.mp3`,
    duration: trimOpt(frontmatterAudio?.duration),
    transcript: trimOpt(frontmatterAudio?.transcript),
  };
}
