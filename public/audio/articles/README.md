# Article audio (author-read MP3s)

## Preferred workflow

1. Publish the article (Markdown under `src/content/articles/` with the correct `slug` in frontmatter).
2. Add the recording to:
   `public/audio/articles/[article-slug]/article.mp3`
3. Rebuild and deploy.
4. The audio player appears automatically. No `audio` frontmatter is required.

On `npm run build` and `npm run dev`, a small manifest is regenerated from disk (`scripts/generate-article-audio-manifest.mjs` → `src/generated/articleAudioSlugs.ts`) so Cloudflare Workers can resolve audio without filesystem access at request time. After adding or removing an MP3, run a build (or dev) so the list stays accurate.

Example file on disk:

`public/audio/articles/what-ai-cant-access/article.mp3`

Public URL (what the site uses internally):

`/audio/articles/what-ai-cant-access/article.mp3`

## Optional frontmatter override

Use `audio` in frontmatter only when you need to:

- Point at a file outside the default slug folder
- Show a manual duration line under the player
- Set a transcript link that already has a real page or URL
- Use a future external audio URL

When `audio.src` is set, it replaces the automatic path. You can still omit `audio` entirely when the default MP3 path is enough.

### Default automatic path (no frontmatter)

Disk:

`public/audio/articles/what-ai-cant-access/article.mp3`

Frontmatter: none required.

### Optional override example

```yaml
audio:
  src: "/audio/articles/custom-folder/article.mp3"
  duration: "12 min"
  transcript: "/articles/what-ai-cant-access/transcript/"
```

### Supplement metadata only (default MP3 on disk)

If the file exists at `public/audio/articles/[slug]/article.mp3`, you may add only extras:

```yaml
audio:
  duration: "12 min"
  transcript: "/articles/example-transcript/"
```

## Transcripts (deferred)

A possible future layout is to store markdown alongside audio:

`public/audio/articles/[article-slug]/transcript.md`

There is no dedicated transcript route yet. The player will **not** auto-link to `transcript.md` so we never emit a dead URL. When you add a real transcript page, set `audio.transcript` to that URL in frontmatter.

## Removing audio

Delete the MP3 (or remove `audio.src` and the default file). Rebuild. Nothing is shown when no audio resolves.
