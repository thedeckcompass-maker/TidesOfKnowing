// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://tidesofknowing.com",
  integrations: [sitemap()],
  server: {
    port: 4322,
  },
});
