import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
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

function assertApplyGate(plan, environment) {
  if (environment !== "staging") {
    throw new Error("Importer writes require --environment staging. Production import remains a later controlled release step.");
  }
  if (plan.sample === "all" && !plan.sourceArchiveChecksum) {
    throw new Error("A full staging import requires the immutable Bird Oracle ZIP so the archive checksum is retained.");
  }
  if (!plan.reconciliation.reconciled) {
    throw new Error(`Import blocked by ${plan.reconciliation.blockingIssues} reconciliation issue(s). Run the dry-run report and resolve them first.`);
  }
}

async function applyPlanViaDataApi(plan, { projectId }) {
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

function postgresPayload(plan, projectId) {
  return {
    projectId,
    sourceSystem: SOURCE_SYSTEM,
    sourceArchiveChecksum: plan.sourceArchiveChecksum,
    projectSettings: plan.projectSettings,
    families: plan.families.map((item) => ({
      ...item,
      targetId: deterministicImportTargetId(projectId, "card_family", item.sourceKey),
    })),
    cards: plan.cards.map((item) => ({
      ...item,
      targetId: deterministicImportTargetId(projectId, "card", item.sourceKey),
    })),
    guidebookSections: plan.guidebookSections.map((item) => ({
      ...item,
      targetId: deterministicImportTargetId(projectId, "guidebook_section", item.sourceKey),
    })),
  };
}

export function buildPostgresImportSql(plan, projectId) {
  if (!/^[a-f0-9-]{36}$/.test(projectId)) throw new Error("The Studio project ID is invalid.");
  const payload = Buffer.from(JSON.stringify(postgresPayload(plan, projectId)), "utf8").toString("base64");
  return `\\set ON_ERROR_STOP on
begin;
create temporary table stage8_payload (document jsonb not null) on commit drop;
create temporary table stage8_result (
  inserted integer not null,
  updated integer not null,
  skipped integer not null,
  records integer not null
) on commit drop;
insert into stage8_payload(document)
values (convert_from(decode('${payload}', 'base64'), 'UTF8')::jsonb);

do $stage8_import$
declare
  plan jsonb := (select document from stage8_payload limit 1);
  target_project uuid := (plan->>'projectId')::uuid;
  source_system_name text := plan->>'sourceSystem';
  archive_checksum text := plan->>'sourceArchiveChecksum';
  item jsonb;
  target_value jsonb;
  previous_checksum text;
  previous_target uuid;
  target uuid;
  family_target uuid;
  card_target uuid;
  had_previous boolean;
  inserted_count integer := 0;
  updated_count integer := 0;
  skipped_count integer := 0;
  record_count integer := 0;
  stale_count integer := 0;
begin
  if not exists (select 1 from public.studio_projects where id = target_project) then
    raise exception 'The target Studio project was not found in staging';
  end if;

  for item in select value from jsonb_array_elements(plan->'families') loop
    previous_checksum := null;
    previous_target := null;
    select source_checksum, target_id into previous_checksum, previous_target
    from public.studio_import_records
    where project_id = target_project and source_system = source_system_name and source_key = item->>'sourceKey';
    had_previous := found;

    if had_previous and previous_checksum = item->>'sourceChecksum' and exists (
      select 1 from public.studio_card_families where id = previous_target and project_id = target_project
    ) then
      target := previous_target;
      skipped_count := skipped_count + 1;
    elsif had_previous and exists (
      select 1 from public.studio_card_families where id = previous_target and project_id = target_project
    ) then
      update public.studio_card_families
      set name = item->>'name', description = coalesce(item->>'description', ''), sort_order = (item->>'sort_order')::integer
      where id = previous_target and project_id = target_project
      returning id into target;
      updated_count := updated_count + 1;
    else
      insert into public.studio_card_families (id, project_id, name, description, sort_order)
      values ((item->>'targetId')::uuid, target_project, item->>'name', coalesce(item->>'description', ''), (item->>'sort_order')::integer)
      on conflict (project_id, name) do update
      set description = excluded.description, sort_order = excluded.sort_order
      returning id into target;
      inserted_count := inserted_count + 1;
    end if;

    insert into public.studio_import_records (
      project_id, source_system, source_key, source_path, source_checksum,
      source_archive_checksum, target_type, target_id, payload, last_seen_at
    ) values (
      target_project, source_system_name, item->>'sourceKey', item->>'sourcePath', item->>'sourceChecksum',
      archive_checksum, 'card_family', target, coalesce(item->'payload', '{}'::jsonb), now()
    ) on conflict (project_id, source_system, source_key) do update set
      source_path = excluded.source_path,
      source_checksum = excluded.source_checksum,
      source_archive_checksum = excluded.source_archive_checksum,
      target_type = excluded.target_type,
      target_id = excluded.target_id,
      payload = excluded.payload,
      last_seen_at = excluded.last_seen_at;
    record_count := record_count + 1;
  end loop;

  for item in select value from jsonb_array_elements(plan->'cards') loop
    target_value := item->'value';
    select target_id into family_target
    from public.studio_import_records
    where project_id = target_project and source_system = source_system_name
      and source_key = 'family:' || (item->>'familyName');
    if family_target is null then raise exception 'Missing imported family for %', item->>'sourceKey'; end if;

    previous_checksum := null;
    previous_target := null;
    select source_checksum, target_id into previous_checksum, previous_target
    from public.studio_import_records
    where project_id = target_project and source_system = source_system_name and source_key = item->>'sourceKey';
    had_previous := found;

    if had_previous and previous_checksum = item->>'sourceChecksum' and exists (
      select 1 from public.studio_cards where id = previous_target and project_id = target_project
    ) then
      target := previous_target;
      skipped_count := skipped_count + 1;
    elsif had_previous and exists (
      select 1 from public.studio_cards where id = previous_target and project_id = target_project
    ) then
      update public.studio_cards set
        family_id = family_target,
        title = target_value->>'title',
        card_number = coalesce(target_value->>'card_number', ''),
        sort_order = (target_value->>'sort_order')::integer,
        status = target_value->>'status',
        content = target_value->'content'
      where id = previous_target and project_id = target_project
      returning id into target;
      updated_count := updated_count + 1;
    else
      insert into public.studio_cards (
        id, project_id, family_id, title, card_number, sort_order, status, content
      ) values (
        (item->>'targetId')::uuid, target_project, family_target, target_value->>'title',
        coalesce(target_value->>'card_number', ''), (target_value->>'sort_order')::integer,
        target_value->>'status', target_value->'content'
      ) on conflict (id) do update set
        family_id = excluded.family_id,
        title = excluded.title,
        card_number = excluded.card_number,
        sort_order = excluded.sort_order,
        status = excluded.status,
        content = excluded.content
      returning id into target;
      inserted_count := inserted_count + 1;
    end if;

    insert into public.studio_import_records (
      project_id, source_system, source_key, source_path, source_checksum,
      source_archive_checksum, target_type, target_id, payload, last_seen_at
    ) values (
      target_project, source_system_name, item->>'sourceKey', item->>'sourcePath', item->>'sourceChecksum',
      archive_checksum, 'card', target, coalesce(item->'payload', '{}'::jsonb), now()
    ) on conflict (project_id, source_system, source_key) do update set
      source_path = excluded.source_path,
      source_checksum = excluded.source_checksum,
      source_archive_checksum = excluded.source_archive_checksum,
      target_type = excluded.target_type,
      target_id = excluded.target_id,
      payload = excluded.payload,
      last_seen_at = excluded.last_seen_at;
    record_count := record_count + 1;
  end loop;

  for item in select value from jsonb_array_elements(plan->'guidebookSections') loop
    target_value := item->'value';
    card_target := null;
    if item->>'cardSourceKey' is not null then
      select target_id into card_target
      from public.studio_import_records
      where project_id = target_project and source_system = source_system_name
        and source_key = item->>'cardSourceKey';
      if card_target is null then raise exception 'Missing imported card for %', item->>'sourceKey'; end if;
    end if;

    previous_checksum := null;
    previous_target := null;
    select source_checksum, target_id into previous_checksum, previous_target
    from public.studio_import_records
    where project_id = target_project and source_system = source_system_name and source_key = item->>'sourceKey';
    had_previous := found;

    if had_previous and previous_checksum = item->>'sourceChecksum' and exists (
      select 1 from public.studio_guidebook_sections where id = previous_target and project_id = target_project
    ) then
      target := previous_target;
      skipped_count := skipped_count + 1;
    elsif had_previous and exists (
      select 1 from public.studio_guidebook_sections where id = previous_target and project_id = target_project
    ) then
      update public.studio_guidebook_sections set
        card_id = card_target,
        section_type = target_value->>'section_type',
        title = target_value->>'title',
        sort_order = (target_value->>'sort_order')::integer,
        status = target_value->>'status',
        body_markdown = coalesce(target_value->>'body_markdown', ''),
        metadata = target_value->'metadata'
      where id = previous_target and project_id = target_project
      returning id into target;
      updated_count := updated_count + 1;
    else
      insert into public.studio_guidebook_sections (
        id, project_id, card_id, section_type, title, sort_order, status, body_markdown, metadata
      ) values (
        (item->>'targetId')::uuid, target_project, card_target, target_value->>'section_type',
        target_value->>'title', (target_value->>'sort_order')::integer, target_value->>'status',
        coalesce(target_value->>'body_markdown', ''), target_value->'metadata'
      ) on conflict (id) do update set
        card_id = excluded.card_id,
        section_type = excluded.section_type,
        title = excluded.title,
        sort_order = excluded.sort_order,
        status = excluded.status,
        body_markdown = excluded.body_markdown,
        metadata = excluded.metadata
      returning id into target;
      inserted_count := inserted_count + 1;
    end if;

    insert into public.studio_import_records (
      project_id, source_system, source_key, source_path, source_checksum,
      source_archive_checksum, target_type, target_id, payload, last_seen_at
    ) values (
      target_project, source_system_name, item->>'sourceKey', item->>'sourcePath', item->>'sourceChecksum',
      archive_checksum, 'guidebook_section', target, coalesce(item->'payload', '{}'::jsonb), now()
    ) on conflict (project_id, source_system, source_key) do update set
      source_path = excluded.source_path,
      source_checksum = excluded.source_checksum,
      source_archive_checksum = excluded.source_archive_checksum,
      target_type = excluded.target_type,
      target_id = excluded.target_id,
      payload = excluded.payload,
      last_seen_at = excluded.last_seen_at;
    record_count := record_count + 1;
  end loop;

  select count(*) into stale_count
  from public.studio_import_records record
  where record.project_id = target_project
    and record.source_system = source_system_name
    and not exists (
      select 1 from (
        select value->>'sourceKey' as source_key from jsonb_array_elements(plan->'families')
        union all
        select value->>'sourceKey' from jsonb_array_elements(plan->'cards')
        union all
        select value->>'sourceKey' from jsonb_array_elements(plan->'guidebookSections')
      ) expected where expected.source_key = record.source_key
    );
  if stale_count <> 0 then raise exception 'Stale import records remain: %', stale_count; end if;

  update public.studio_projects set
    deck_size = jsonb_array_length(plan->'cards'),
    settings = jsonb_set(
      coalesce(settings, '{}'::jsonb) || coalesce(plan->'projectSettings', '{}'::jsonb),
      '{custom}',
      coalesce(settings->'custom', '{}'::jsonb) || coalesce(plan->'projectSettings'->'custom', '{}'::jsonb),
      true
    )
  where id = target_project;

  if (select count(*) from public.studio_card_families where project_id = target_project) <> jsonb_array_length(plan->'families')
    or (select count(*) from public.studio_cards where project_id = target_project) <> jsonb_array_length(plan->'cards')
    or (select count(*) from public.studio_guidebook_sections where project_id = target_project) <> jsonb_array_length(plan->'guidebookSections')
    or (select count(*) from public.studio_import_records where project_id = target_project and source_system = source_system_name) <> record_count
  then raise exception 'Post-import target counts do not reconcile'; end if;

  if exists (
    select 1
    from public.studio_import_records record
    join public.studio_guidebook_sections section on section.id = record.target_id and section.project_id = target_project
    where record.project_id = target_project
      and record.source_system = source_system_name
      and record.target_type = 'guidebook_section'
      and (record.source_key like 'bird-guidebook:%' or record.source_key like 'tarot:%')
      and section.card_id is null
  ) then raise exception 'One or more card-to-guidebook relationships are missing'; end if;

  if exists (
    select 1 from public.studio_import_records
    where project_id = target_project and source_system = source_system_name
      and source_archive_checksum is distinct from archive_checksum
  ) then raise exception 'One or more provenance records have the wrong archive checksum'; end if;

  if exists (
    select 1
    from jsonb_array_elements(plan->'families') expected
    join public.studio_import_records record
      on record.project_id = target_project
      and record.source_system = source_system_name
      and record.source_key = expected->>'sourceKey'
    join public.studio_card_families family
      on family.id = record.target_id and family.project_id = target_project
    where family.name is distinct from expected->>'name'
      or family.description is distinct from coalesce(expected->>'description', '')
      or family.sort_order is distinct from (expected->>'sort_order')::integer
  ) then raise exception 'One or more imported families do not match the reconciled plan'; end if;

  if exists (
    select 1
    from jsonb_array_elements(plan->'cards') expected
    join public.studio_import_records record
      on record.project_id = target_project
      and record.source_system = source_system_name
      and record.source_key = expected->>'sourceKey'
    join public.studio_cards card
      on card.id = record.target_id and card.project_id = target_project
    join public.studio_import_records family_record
      on family_record.project_id = target_project
      and family_record.source_system = source_system_name
      and family_record.source_key = 'family:' || (expected->>'familyName')
    where card.family_id is distinct from family_record.target_id
      or card.title is distinct from expected->'value'->>'title'
      or card.card_number is distinct from coalesce(expected->'value'->>'card_number', '')
      or card.sort_order is distinct from (expected->'value'->>'sort_order')::integer
      or card.status is distinct from expected->'value'->>'status'
      or card.content is distinct from expected->'value'->'content'
  ) then raise exception 'One or more imported cards do not match the reconciled plan'; end if;

  if exists (
    select 1
    from jsonb_array_elements(plan->'guidebookSections') expected
    join public.studio_import_records record
      on record.project_id = target_project
      and record.source_system = source_system_name
      and record.source_key = expected->>'sourceKey'
    join public.studio_guidebook_sections section
      on section.id = record.target_id and section.project_id = target_project
    left join public.studio_import_records card_record
      on card_record.project_id = target_project
      and card_record.source_system = source_system_name
      and card_record.source_key = expected->>'cardSourceKey'
    where section.card_id is distinct from card_record.target_id
      or section.section_type is distinct from expected->'value'->>'section_type'
      or section.title is distinct from expected->'value'->>'title'
      or section.sort_order is distinct from (expected->'value'->>'sort_order')::integer
      or section.status is distinct from expected->'value'->>'status'
      or section.body_markdown is distinct from coalesce(expected->'value'->>'body_markdown', '')
      or section.metadata is distinct from expected->'value'->'metadata'
  ) then raise exception 'One or more guidebook sections do not match the reconciled plan'; end if;

  insert into stage8_result values (inserted_count, updated_count, skipped_count, record_count);
end
$stage8_import$;

select json_build_object(
  'inserted', inserted,
  'updated', updated,
  'skipped', skipped,
  'records', records
)::text from stage8_result;
commit;
`;
}

function applyPlanViaPostgres(plan, { projectId }) {
  const databaseUrl = required(process.env.STUDIO_IMPORT_DATABASE_URL, "STUDIO_IMPORT_DATABASE_URL is required for the direct staging database importer.");
  const expectedProjectRef = required(process.env.STUDIO_IMPORT_EXPECTED_PROJECT_REF, "STUDIO_IMPORT_EXPECTED_PROJECT_REF is required for the direct staging database importer.");
  if (!databaseUrl.includes(expectedProjectRef)) {
    throw new Error("The direct database importer is not connected to the authorised Studio staging project.");
  }
  const execution = spawnSync("psql", [databaseUrl, "--no-psqlrc", "--quiet", "--tuples-only", "--no-align"], {
    input: buildPostgresImportSql(plan, projectId),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (execution.error) throw execution.error;
  if (execution.status !== 0) throw new Error(`Direct staging import failed: ${execution.stderr.trim()}`);
  const resultLine = execution.stdout.trim().split("\n").map((line) => line.trim()).filter(Boolean).at(-1);
  if (!resultLine) throw new Error("Direct staging import did not return a reconciliation result.");
  return JSON.parse(resultLine);
}

async function applyPlan(plan, { projectId, environment }) {
  assertApplyGate(plan, environment);
  if (process.env.STUDIO_IMPORT_DATABASE_URL) return applyPlanViaPostgres(plan, { projectId });
  return applyPlanViaDataApi(plan, { projectId });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = argumentsFrom(process.argv.slice(2));
  const source = required(args.source, "Use --source with the immutable Bird Oracle ZIP or an extracted source directory.");
  const sample = args.sample === "all" ? "all" : "representative";
  const plan = buildAotearoaBirdOraclePlan(source, {
    sample,
    sourceArchiveChecksum: typeof args["source-archive-checksum"] === "string" ? args["source-archive-checksum"] : null,
  });
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
}
