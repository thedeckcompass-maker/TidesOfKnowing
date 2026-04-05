/** Config `site` in production; in dev `Astro.site` may be missing — use the request URL origin. */
export function siteBase(astro: { site: URL | undefined; url: URL }): URL {
  return astro.site ?? astro.url;
}
