// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
// Sitemap: `src/pages/sitemap.xml.ts` (priorities + changefreq).
// TODO: Consider future `/field-notes/` canonical route with `/blog/` redirects.
export default defineConfig({
  site: "https://www.tidesofknowing.com",
  output: "server",
  adapter: cloudflare(),
  integrations: [],
  server: {
    port: 4322,
  },
  redirects: {
    "/library/": "/articles/",
    "/topics/": "/tags/",
    "/blog/welcome-to-the-library/": "/blog/welcome-to-tides-of-knowing/",
    "/blog/compass-method-anchor-article/": "/articles/compass-method/",
  },
});