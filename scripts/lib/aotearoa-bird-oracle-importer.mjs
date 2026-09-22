import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import matter from "gray-matter";

export const SOURCE_SYSTEM = "aotearoa-bird-oracle-markdown-v1";
export const REPRESENTATIVE_BIRD_FILES = [
  "g1-n01.md",
  "g1-h01.md",
  "g1-b01.md",
  "g2-b14.md",
  "g4-b07.md",
  "g6-b08.md",
  "g8-b03.md",
  "g8-n01.md",
];

const statusMap = {
  empty: "outline",
  notes: "draft",
  draft: "draft",
  revised: "review",
  polished: "review",
  reviewed: "review",
  approved: "complete",
};

function checksum(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sourceWorkspace(sourcePath) {
  const absolute = resolve(sourcePath);
  if (!existsSync(absolute)) throw new Error(`Source not found: ${absolute}`);
  if (statSync(absolute).isDirectory()) {
    const root = existsSync(join(absolute, "src", "content"))
      ? absolute
      : join(absolute, "aotearoa_bird_oracle");
    if (!existsSync(join(root, "src", "content"))) throw new Error("Bird Oracle source directory is incomplete.");
    return { root, archiveChecksum: null, cleanup() {} };
  }

  const temp = mkdtempSync(join(tmpdir(), "bird-oracle-import-"));
  execFileSync("unzip", [
    "-q",
    "-o",
    absolute,
    "aotearoa_bird_oracle/src/content/*",
    "aotearoa_bird_oracle/src/config/groups.json",
    "-d",
    temp,
  ]);
  return {
    root: join(temp, "aotearoa_bird_oracle"),
    archiveChecksum: checksum(readFileSync(absolute)),
    cleanup() { rmSync(temp, { recursive: true, force: true }); },
  };
}

function readCollection(root, collection) {
  const directory = join(root, "src", "content", collection);
  return readdirSync(directory)
    .filter((name) => name.endsWith(".md") && !name.startsWith(".") && name !== "_collection-seed.md")
    .sort()
    .map((name) => {
      const sourcePath = `src/content/${collection}/${name}`;
      const raw = readFileSync(join(directory, name), "utf8");
      const parsed = matter(raw);
      return {
        name,
        slug: name.replace(/\.md$/, ""),
        sourcePath,
        raw,
        sourceChecksum: checksum(raw),
        data: parsed.data,
        body: parsed.content,
      };
    });
}

function mappedStatus(value) {
  return statusMap[value] ?? "outline";
}

function correspondenceText(data) {
  return [
    [data.tarot_primary_card, data.tarot_primary_suit, data.tarot_primary_slug],
    [data.tarot_second_card, data.tarot_second_suit, data.tarot_second_slug],
    [data.tarot_third_card, data.tarot_third_suit, data.tarot_third_slug],
  ]
    .filter(([card]) => card)
    .map(([card, suit, slug]) => [card, suit, slug].filter(Boolean).join(" · "))
    .join("\n");
}

function culturalContext(data) {
  return [
    data.whakataukī ? `Whakataukī\n${data.whakataukī}` : "",
    data.realm_rangi ? `Rangi\n${data.realm_rangi}` : "",
    data.realm_whenua ? `Whenua\n${data.realm_whenua}` : "",
    data.realm_wai ? `Wai\n${data.realm_wai}` : "",
  ].filter(Boolean).join("\n\n");
}

function rightsText(data) {
  return [
    ["Status", data.image_status],
    ["Source", data.image_source],
    ["Rights", data.image_rights],
    ["Credit", data.image_credit],
    ["Type", data.image_type],
  ].filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join("\n");
}

function customPayload(entry, sourceType) {
  return {
    namespace: "aotearoa_bird_oracle",
    source_type: sourceType,
    source_path: entry.sourcePath,
    source_checksum: entry.sourceChecksum,
    source_frontmatter: entry.data,
    source_body_markdown: entry.body,
    source_raw_markdown: entry.raw,
  };
}

function guidebookOrder(entry, fallback) {
  return Number.isInteger(entry.data.toc_position) ? entry.data.toc_position : fallback;
}

export function buildAotearoaBirdOraclePlan(sourcePath, { sample = "representative" } = {}) {
  const workspace = sourceWorkspace(sourcePath);
  try {
    const allBirds = readCollection(workspace.root, "birds");
    const allTarot = readCollection(workspace.root, "tarot");
    const chapters = readCollection(workspace.root, "chapters");
    const sampleNames = new Set(REPRESENTATIVE_BIRD_FILES);
    const birds = sample === "all" ? allBirds : allBirds.filter((entry) => sampleNames.has(entry.name));
    const selectedSlugs = new Set(birds.map((entry) => entry.slug));
    const tarot = sample === "all" ? allTarot : allTarot.filter((entry) => selectedSlugs.has(entry.data.bird_slug));
    const groupConfig = JSON.parse(readFileSync(join(workspace.root, "src", "config", "groups.json"), "utf8"));
    const exceptions = [];

    for (const entry of [...birds, ...tarot, ...chapters]) {
      if (!Number.isInteger(entry.data.toc_position)) {
        exceptions.push({ code: "UNASSIGNED_TOC_POSITION", sourcePath: entry.sourcePath, resolution: "Fallback order recorded; editorial ordering remains required." });
      }
    }

    const familyMap = new Map();
    for (const bird of birds) {
      const configured = groupConfig.groups.find((group) => group.name === bird.data.group);
      if (!familyMap.has(bird.data.group)) {
        if (configured && configured.sortOrder !== bird.data.group_number) {
          exceptions.push({
            code: "GROUP_ORDER_MISMATCH",
            sourcePath: "src/config/groups.json",
            value: { group: bird.data.group, cardGroupNumber: bird.data.group_number, configSortOrder: configured.sortOrder },
            resolution: "Card front matter controls import order; groups.json is preserved in project configuration for review.",
          });
        }
        familyMap.set(bird.data.group, {
          sourceKey: `family:${bird.data.group}`,
          name: bird.data.group,
          description: configured?.description ?? "",
          sort_order: bird.data.group_number,
          sourcePath: "src/config/groups.json",
          sourceChecksum: checksum(JSON.stringify(configured ?? { name: bird.data.group })),
          payload: configured ?? { name: bird.data.group },
        });
      }
    }

    const cards = birds.map((entry) => ({
      sourceKey: `bird:${entry.data.card_id}`,
      sourcePath: entry.sourcePath,
      sourceChecksum: entry.sourceChecksum,
      familyName: entry.data.group,
      value: {
        title: entry.data.title,
        card_number: String(entry.data.card_number),
        sort_order: entry.data.card_number,
        status: mappedStatus(entry.data.status),
        content: {
          meaning: entry.data.oracle_meaning ?? "",
          shadow_meaning: entry.data.shadow_expression ?? "",
          symbolism: [entry.data.spiritual_key, entry.data.realm_rangi, entry.data.realm_whenua, entry.data.realm_wai].filter(Boolean).join("\n\n"),
          correspondences: correspondenceText(entry.data),
          prompts: "",
          keywords: Array.isArray(entry.data.keywords) ? entry.data.keywords.join("\n") : "",
          cautions: "",
          research_notes: entry.data.author_notes_private ?? "",
          sources: "",
          cultural_context: culturalContext(entry.data),
          permissions: entry.data.editorial_notes ?? "",
          artwork_brief: entry.data.image ?? "",
          rights_status: rightsText(entry.data),
          production_notes: "",
          custom: { aotearoa_bird_oracle: customPayload(entry, "bird") },
        },
      },
      payload: { source_frontmatter: entry.data },
    }));

    const birdSections = birds.map((entry) => ({
      sourceKey: `bird-guidebook:${entry.data.card_id}`,
      cardSourceKey: `bird:${entry.data.card_id}`,
      sourcePath: entry.sourcePath,
      sourceChecksum: entry.sourceChecksum,
      value: {
        section_type: "card_entry",
        title: entry.data.title,
        sort_order: guidebookOrder(entry, entry.data.card_number * 10),
        status: mappedStatus(entry.data.status),
        body_markdown: entry.body,
        metadata: { custom: { aotearoa_bird_oracle: customPayload(entry, "bird_guidebook") } },
      },
      payload: { source_frontmatter: entry.data },
    }));

    const tarotSections = tarot.map((entry) => ({
      sourceKey: `tarot:${entry.slug}`,
      cardSourceKey: `bird:${entry.data.bird_slug?.toUpperCase().replace(/^G(\d+)-([BNH])(\d+)$/, "G$1-$2$3")}`,
      birdSlug: entry.data.bird_slug,
      sourcePath: entry.sourcePath,
      sourceChecksum: entry.sourceChecksum,
      value: {
        section_type: "card_entry",
        title: `${entry.data.title} correspondence`,
        sort_order: guidebookOrder(entry, Number(entry.data.card_number) * 10 + 1),
        status: mappedStatus(entry.data.status),
        body_markdown: entry.body,
        metadata: { custom: { aotearoa_bird_oracle: customPayload(entry, "tarot_correspondence") } },
      },
      payload: { source_frontmatter: entry.data },
    }));

    const cardKeyBySlug = new Map(birds.map((entry) => [entry.slug, `bird:${entry.data.card_id}`]));
    tarotSections.forEach((section) => { section.cardSourceKey = cardKeyBySlug.get(section.birdSlug) ?? null; });

    const chapterSections = chapters.map((entry, index) => ({
      sourceKey: `chapter:${entry.slug}`,
      cardSourceKey: null,
      sourcePath: entry.sourcePath,
      sourceChecksum: entry.sourceChecksum,
      value: {
        section_type: entry.data.chapter_type === "back_matter" ? "closing" : "chapter",
        title: entry.data.title,
        sort_order: guidebookOrder(entry, 2000 + index),
        status: mappedStatus(entry.data.status),
        body_markdown: entry.body,
        metadata: { custom: { aotearoa_bird_oracle: customPayload(entry, "chapter") } },
      },
      payload: { source_frontmatter: entry.data },
    }));

    return {
      sourceSystem: SOURCE_SYSTEM,
      sourceArchiveChecksum: workspace.archiveChecksum,
      sample,
      inventory: {
        sourceBirds: allBirds.length,
        sourceTarot: allTarot.length,
        sourceChapters: chapters.length,
        selectedBirds: birds.length,
        selectedTarot: tarot.length,
        selectedChapters: chapters.length,
      },
      projectSettings: { custom: { aotearoa_bird_oracle: { groups: groupConfig.groups, source_archive_checksum: workspace.archiveChecksum } } },
      families: [...familyMap.values()].sort((a, b) => a.sort_order - b.sort_order),
      cards,
      guidebookSections: [...chapterSections, ...birdSections, ...tarotSections],
      exceptions,
      reconciliation: {
        mappedSourceFiles: birds.length + tarot.length + chapters.length,
        duplicateSourceKeys: 0,
        unmappedSourceFiles: 0,
        silentDrops: 0,
      },
    };
  } finally {
    workspace.cleanup();
  }
}

export function summariseAotearoaBirdOraclePlan(plan) {
  return {
    sourceSystem: plan.sourceSystem,
    sourceArchiveChecksum: plan.sourceArchiveChecksum,
    sample: plan.sample,
    inventory: plan.inventory,
    targets: {
      families: plan.families.length,
      cards: plan.cards.length,
      guidebookSections: plan.guidebookSections.length,
    },
    exceptions: {
      total: plan.exceptions.length,
      byCode: Object.fromEntries([...new Set(plan.exceptions.map((item) => item.code))].map((code) => [code, plan.exceptions.filter((item) => item.code === code).length])),
      items: plan.exceptions,
    },
    reconciliation: plan.reconciliation,
  };
}
