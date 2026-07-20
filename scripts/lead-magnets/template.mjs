function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMetadataLine(metadata) {
  const items = [metadata.series, metadata.author, metadata.date]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  if (items.length === 0) return "";

  return `<p class="tok-pdf-cover__meta">${items.map(escapeHtml).join(" · ")}</p>`;
}

function renderHero(metadata) {
  if (!metadata.heroImage) return "";

  return `
    <figure class="tok-pdf-cover__figure">
      <img class="tok-pdf-cover__image" src="${escapeHtml(metadata.heroImage)}" alt="" />
    </figure>
  `;
}

function renderToc(headings) {
  if (!headings.length) return "";

  return `
    <nav class="tok-pdf-toc" aria-label="Table of contents">
      <p class="tok-pdf-eyebrow">Inside this guide</p>
      <h2 class="tok-pdf-toc__title">Table of Contents</h2>
      <ol class="tok-pdf-toc__list">
        ${headings
          .map(
            (heading) => `
              <li class="tok-pdf-toc__item tok-pdf-toc__item--h${heading.level}">
                <a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a>
              </li>
            `,
          )
          .join("")}
      </ol>
    </nav>
  `;
}

function renderCta(metadata) {
  const ctaLabel = String(metadata.ctaLabel ?? "").trim();
  const ctaText = String(metadata.ctaText ?? "").trim();
  const ctaUrl = String(metadata.ctaUrl ?? "").trim();

  if (!ctaLabel && !ctaText && !ctaUrl) return "";

  return `
    <aside class="tok-pdf-cta">
      <p class="tok-pdf-cta__eyebrow">Continue with Tides of Knowing</p>
      ${ctaLabel ? `<p class="tok-pdf-cta__label">${escapeHtml(ctaLabel)}</p>` : ""}
      ${ctaText ? `<p class="tok-pdf-cta__text">${escapeHtml(ctaText)}</p>` : ""}
      ${ctaUrl ? `<p class="tok-pdf-cta__link">${escapeHtml(ctaUrl)}</p>` : ""}
    </aside>
  `;
}

export function renderLeadMagnetHtml({ metadata, bodyHtml, headings, printCss }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(metadata.title)}</title>
    <style>${printCss}</style>
  </head>
  <body>
    <main class="tok-pdf">
      <section class="tok-pdf-cover" aria-label="Cover">
        <div class="tok-pdf-cover__brand">
          <span class="tok-pdf-cover__brand-name">Tides of Knowing</span>
          <span class="tok-pdf-cover__brand-rule"></span>
        </div>
        <div class="tok-pdf-cover__grid">
          <div class="tok-pdf-cover__content">
            <p class="tok-pdf-eyebrow">Free checklist</p>
            <h1 class="tok-pdf-cover__title">${escapeHtml(metadata.title)}</h1>
            ${
              metadata.subtitle
                ? `<p class="tok-pdf-cover__subtitle">${escapeHtml(metadata.subtitle)}</p>`
                : ""
            }
            <p class="tok-pdf-cover__description">${escapeHtml(metadata.description)}</p>
            ${renderMetadataLine(metadata)}
          </div>
          ${renderHero(metadata)}
        </div>
      </section>

      ${renderToc(headings)}

      <article class="tok-pdf-prose">
        ${bodyHtml}
      </article>

      ${renderCta(metadata)}
    </main>
  </body>
</html>`;
}
