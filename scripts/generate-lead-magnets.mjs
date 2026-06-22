import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";
import { renderLeadMagnetHtml } from "./lead-magnets/template.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceRoot = path.join(root, "content-intake", "lead-magnets");
const outputRoot = path.join(root, "public", "downloads");
const printCssPath = path.join(__dirname, "lead-magnets", "print.css");

const SITE_URL = "https://www.tidesofknowing.com";

const requiredFields = ["title", "description", "filename", "author", "date"];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function publicUrlToFileUrl(value) {
  if (!value || typeof value !== "string") return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("file:")) return value;
  if (!value.startsWith("/")) return value;
  return pathToFileURL(path.join(root, "public", value)).href;
}

function siteAbsoluteUrl(value) {
  if (!value || typeof value !== "string") return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith("/")) return value;
  return `${SITE_URL}${value}`;
}

function extractText(tokens, startIndex) {
  const token = tokens[startIndex + 1];
  if (!token || token.type !== "inline") return "";
  return token.children
    ? token.children
        .filter((child) => child.type === "text" || child.type === "code_inline")
        .map((child) => child.content)
        .join("")
    : token.content;
}

function collectHeadings(tokens) {
  const seen = new Map();
  const headings = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== "heading_open") continue;
    const level = Number(token.tag.replace("h", ""));
    if (level !== 2 && level !== 3) continue;

    const text = extractText(tokens, i).trim();
    if (!text) continue;

    const baseSlug = slugify(text) || `section-${headings.length + 1}`;
    const count = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, count + 1);
    const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
    const isWorksheet = /\bworksheet\b/i.test(text);

    token.attrSet("id", id);
    token.attrJoin("class", "tok-pdf-heading");
    if (isWorksheet) token.attrJoin("class", "tok-pdf-heading--worksheet");

    headings.push({ id, text, level, isWorksheet });
  }

  return headings;
}

function createMarkdownRenderer() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });

  const defaultLinkOpen =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet("href");
    if (href?.startsWith("/")) {
      tokens[idx].attrSet("href", `${SITE_URL}${href}`);
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  const defaultImage =
    md.renderer.rules.image ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const src = tokens[idx].attrGet("src");
    if (src?.startsWith("/")) {
      tokens[idx].attrSet("src", publicUrlToFileUrl(src));
    }
    return defaultImage(tokens, idx, options, env, self);
  };

  return md;
}

function validateMetadata(data, sourcePath) {
  const missing = requiredFields.filter((field) => !String(data[field] ?? "").trim());
  if (missing.length > 0) {
    throw new Error(`${sourcePath} is missing required frontmatter: ${missing.join(", ")}`);
  }
  if (!String(data.filename).endsWith(".pdf")) {
    throw new Error(`${sourcePath} frontmatter filename must end with .pdf`);
  }
}

async function renderLeadMagnet(sourceDir, printCss) {
  const sourcePath = path.join(sourceDir, "index.md");
  const raw = await fs.readFile(sourcePath, "utf8");
  const { data, content } = matter(raw);
  validateMetadata(data, sourcePath);

  const md = createMarkdownRenderer();
  const env = {};
  const tokens = md.parse(content, env);
  const headings = collectHeadings(tokens);
  const bodyHtml = md.renderer.render(tokens, md.options, env);

  const html = renderLeadMagnetHtml({
    metadata: {
      ...data,
      siteUrl: SITE_URL,
      heroImage: publicUrlToFileUrl(data.heroImage),
      ctaUrl: siteAbsoluteUrl(data.ctaUrl),
    },
    bodyHtml,
    headings,
    printCss,
  });

  return {
    html,
    outputPath: path.join(outputRoot, data.filename),
    title: data.title,
  };
}

async function discoverLeadMagnets() {
  await fs.mkdir(sourceRoot, { recursive: true });
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(sourceRoot, entry.name));
}

function footerTemplate(title) {
  return `
    <div style="width:100%;padding:0 0.45in;font-family:Inter,Arial,sans-serif;font-size:8px;color:#4B5563;display:flex;align-items:center;justify-content:space-between;">
      <span>${escapeHtml(title)}</span>
      <span>Tides of Knowing · ${SITE_URL.replace(/^https?:\/\//, "")}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;
}

async function main() {
  const sourceDirs = await discoverLeadMagnets();
  if (sourceDirs.length === 0) {
    console.log("No lead magnet sources found in content-intake/lead-magnets/.");
    return;
  }

  await fs.mkdir(outputRoot, { recursive: true });
  const printCss = await fs.readFile(printCssPath, "utf8");
  const browser = await puppeteer.launch({ headless: "new" });

  try {
    for (const sourceDir of sourceDirs) {
      const { html, outputPath, title } = await renderLeadMagnet(sourceDir, printCss);
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: ["load", "networkidle0"] });
      await page.emulateMediaType("print");
      await page.pdf({
        path: outputPath,
        format: "Letter",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: footerTemplate(title),
        margin: {
          top: "0.5in",
          right: "0.55in",
          bottom: "0.72in",
          left: "0.55in",
        },
      });
      await page.close();
      console.log(`Generated ${path.relative(root, outputPath)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
