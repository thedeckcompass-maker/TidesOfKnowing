// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
// Sitemap: `src/pages/sitemap.xml.ts` (priorities + changefreq).
export default defineConfig({
  site: "https://www.tidesofknowing.com",
  integrations: [],
  server: {
    port: 4322,
  },
  redirects: {
    "/library/": "/articles/",
    "/topics/": "/tags/",
    "/blog/welcome-to-the-library/": "/blog/welcome-to-tides-of-knowing/",
  },
});
