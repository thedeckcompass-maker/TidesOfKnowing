import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  SOURCE_SYSTEM,
  buildAotearoaBirdOraclePlan,
  deterministicImportTargetId,
  summariseAotearoaBirdOraclePlan,
} from "./lib/aotearoa-bird-oracle-importer.mjs";

function argumentsFrom(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const [key, inline] = item.slice(2).split("=", 2);
    if (inline !== undefined) values[key] = inline;
    else if (argv[index + 1] && !argv[index + 1].startsWith("--")) values[key] = argv[++index];
    else values[key] = true;
  }
  return values;
}

function required(value, message) {
  if (!value || typeof value !== "string") throw new Error(message);
  return value;
}

function mergeProjectSettings(current, imported) {
  return {
    ...(current ?? {}),
    ...imported,
    custom: {
      ...(current?.custom ?? {}),
      ...(imported.custom ?? {}),
    },
  };
}

async function applyPlan(plan, { projectId, environment }) {
  if (environment !== "staging") {
    throw new Error("Importer writes require --environment staging. Production import remains a later controlled release step.");
  }
  const supabaseUrl = required(process.env.STUDIO_IMPORT_SUPABASE_URL, "STUDIO_IMPORT_SUPABASE_URL is required for --apply.");
  const serviceRoleKey = required(process.env.STUDIO_IMPORT_SUPABASE_SERVICE_ROLE_KEY, "STUDIO_IMPORT_SUPABASE_SERVICE_ROLE_KEY is required for --apply.");
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: project, error: projectError } = await supabase
    .from("studio_projects")
    .select("id, settings")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) throw new Error("The target Studio project was not found in staging.");

  const { data: existingRows, error: existingError } = await supabase
    .from("studio_import_records")
    .select("source_key, source_checksum, target_type, target_id")
    .eq("project_id", projectId)
    .eq("source_system", SOURCE_SYSTEM);
  if (existingError) throw existingError;
  const existing = new Map((existingRows ?? []).map((row) => [row.source_key, row]));
  const results = { inserted: 0, updated: 0, skipped: 0, records: 0 };

  async function record(item, targetType, targetId) {
    const { error } = await supabase.from("studio_import_records").upsert({
      project_id: projectId,
      source_system: SOURCE_SYSTEM,
      source_key: item.sourceKey,
      source_path: item.sourcePath,
      source_checksum: item.sourceChecksum,
      source_archive_checksum: plan.sourceArchiveChecksum,
      target_type: targetType,
      target_id: targetId,
      payload: item.payload ?? {},
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "project_id,source_system,source_key" });
    if (error) throw error;
    existing.set(item.sourceKey, { source_key: item.sourceKey, source_checksum: item.sourceChecksum, target_type: targetType, target_id: targetId });
    results.records += 1;
  }

  async function importTarget(item, targetType, table, value) {
    const previous = existing.get(item.sourceKey);
    if (previous?.source_checksum === item.sourceChecksum) {
      results.skipped += 1;
      await record(item, targetType, previous.target_id);
      return previous.target_id;
    }

    if (previous?.target_id) {
      const { data, error } = await supabase.from(table).update(value).eq("id", previous.target_id).eq("project_id", projectId).select("id").maybeSingle();
      if (error) throw error;
      if (data?.id) {
        results.updated += 1;
        await record(item, targetType, data.id);
        return data.id;
      }
    }

    const targetId = deterministicImportTargetId(projectId, targetType, item.sourceKey);
    const { data, error } = await supabase
      .from(table)
      .upsert({ id: targetId, project_id: projectId, ...value }, { onConflict: "id" })
      .select("id")
      .single();
    if (error) throw error;
    results.inserted += 1;
    await record(item, targetType, data.id);
    return data.id;
  }

  const familyIds = new Map();
  for (const family of plan.families) {
    const previous = existing.get(family.sourceKey);
    if (previous?.source_checksum === family.sourceChecksum) {
      familyIds.set(family.name, previous.target_id);
      results.skipped += 1;
      await record(family, "card_family", previous.target_id);
      continue;
    }
    const { data, error } = await supabase
      .from("studio_card_families")
      .upsert({ project_id: projectId, name: family.name, description: family.description, sort_order: family.sort_order }, { onConflict: "project_id,name" })
      .select("id")
      .single();
    if (error) throw error;
    familyIds.set(family.name, data.id);
    previous ? results.updated += 1 : results.inserted += 1;
    await record(family, "card_family", data.id);
  }

  const cardIds = new Map();
  for (const card of plan.cards) {
    const familyId = familyIds.get(card.familyName) ?? null;
    const targetId = await importTarget(card, "card", "studio_cards", { ...card.value, family_id: familyId });
    cardIds.set(card.sourceKey, targetId);
  }

  for (const section of plan.guidebookSections) {
    const cardId = section.cardSourceKey ? cardIds.get(section.cardSourceKey) ?? existing.get(section.cardSourceKey)?.target_id ?? null : null;
    await importTarget(section, "guidebook_section", "studio_guidebook_sections", { ...section.value, card_id: cardId });
  }

  const { error: settingsError } = await supabase
    .from("studio_projects")
    .update({ settings: mergeProjectSettings(project.settings, plan.projectSettings) })
    .eq("id", projectId);
  if (settingsError) throw settingsError;
  return results;
}

const args = argumentsFrom(process.argv.slice(2));
const source = required(args.source, "Use --source with the immutable Bird Oracle ZIP or an extracted source directory.");
const sample = args.sample === "all" ? "all" : "representative";
const plan = buildAotearoaBirdOraclePlan(source, { sample });
const report = summariseAotearoaBirdOraclePlan(plan);

if (args.apply) {
  const projectId = required(args["project-id"], "Use --project-id for --apply.");
  report.apply = await applyPlan(plan, { projectId, environment: args.environment });
} else {
  report.apply = { mode: "dry-run", databaseWrites: 0 };
}

const output = `${JSON.stringify(report, null, 2)}\n`;
if (typeof args.report === "string") writeFileSync(args.report, output, "utf8");
process.stdout.write(output);
