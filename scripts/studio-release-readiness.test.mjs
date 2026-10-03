import assert from "node:assert/strict";
import { studioMarkdownExport } from "../src/lib/studio/export.ts";
import { STUDIO_LESSONS } from "../src/lib/studio/lessons.ts";

const rawSource = "Research note with `code` and a separate ```quoted block```.\nSecond line: ngā manu.";
const nestedCard = {
  title: "Test card", card_number: "01",
  content: { custom: { source_body_markdown: rawSource, source_frontmatter: { group: "A", tags: ["one", "two"] } } },
};
const snapshot = {
  exported_at: "2026-09-23T00:00:00Z",
  project: { name: "Test deck", description: "A private project" },
  families: [], cards: [nestedCard],
  guidebook: [{ title: "Opening", body_markdown: "First complete sentence." }],
  journal: [{ title: "Private note", body_markdown: "A deliberate observation." }],
  production_plan: { status: "draft", component_specifications: "78 cards at a tested trim size" },
};
const markdown = studioMarkdownExport(snapshot);
const customBlock = markdown.match(/#### custom\n\n````json\n([\s\S]*?)\n````/);
assert.ok(customBlock, "Nested card content must be represented as structured JSON.");
assert.equal(JSON.parse(customBlock[1]).source_body_markdown, rawSource,
  "The source's exact Markdown text must survive an export round trip.");
assert.ok(markdown.includes('"source_frontmatter": {'));
assert.ok(markdown.includes('"tags": ['));
assert.ok(markdown.includes("78 cards at a tested trim size"));
assert.ok(!markdown.includes("[object Object]"), "Nested source material must never collapse to an object label.");
assert.match(markdown, /````json\n[\s\S]*```quoted block```[\s\S]*\n````/);

assert.deepEqual(Object.keys(STUDIO_LESSONS).map(Number), Array.from({ length: 12 }, (_, i) => i + 1));
for (const [week, lesson] of Object.entries(STUDIO_LESSONS)) {
  const fullText = [lesson.focus, ...lesson.method, lesson.workingExample, lesson.review].join(" ");
  assert.ok(fullText.split(/\s+/).length >= 190, `Week ${week} requires a usable working lesson.`);
  assert.equal(lesson.method.length, 3);
  assert.ok(!fullText.includes("—"));
}
console.log("Deck Creator Studio release export and programme content: passed");
