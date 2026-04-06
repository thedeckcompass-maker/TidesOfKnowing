# Staging (inbox)

Use this folder **only** for **new** article work **before** it is published to the site.

1. **Drop files here:** article `.md` (named `{slug}.md`) and, if you have them, images named `{slug}-…` (see the project’s image naming guide).  
2. **Publish:** run `npm run publish-article`. That copies markdown into `src/content/articles/` and images into `public/images/articles/<slug>/`.  
3. **After publishing:** delete the copies from `staging/` so this folder is empty again except for `.gitkeep` and this README.

**Canonical locations after publish**

- Article source: `src/content/articles/<slug>.md` — edit published articles **here**, not in `staging/`.  
- Published images: `public/images/articles/<slug>/`.

Do not keep published articles in `staging/`; it is a temporary inbox, not a second source of truth.
