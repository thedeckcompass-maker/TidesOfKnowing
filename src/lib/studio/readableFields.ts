import { isLegacyBirdManuscript, legacyReadingMarkdown, rightsReadingText } from './readingText.ts';
/** Presentation only: original records remain intact in the database and backup data/. */
export type ReadableKind = 'card' | 'guidebook' | 'production';
export type ReadableField = { key: string; label: string; value: string; legacyProse?: boolean };
export type ReadableReferences = { families?: Record<string, string>; cards?: Record<string, string> };

const labels: Record<string, string> = {
  title: 'Title', card_number: 'Card number', family_id: 'Family', sort_order: 'Order', status: 'Status',
  meaning: 'Core meaning', shadow_meaning: 'Shadow or cautionary meaning', keywords: 'Keywords',
  cautions: 'Cautions', symbolism: 'Symbolism', correspondences: 'Correspondences',
  prompts: 'Prompts or questions', research_notes: 'Private research notes', sources: 'Sources and attribution',
  cultural_context: 'Cultural context', permissions: 'Permissions and unresolved rights',
  artwork_brief: 'Artwork brief', rights_status: 'Artwork rights status', production_notes: 'Production notes',
  section_type: 'Section type', card_id: 'Card this section belongs to', body_markdown: 'Manuscript',
  planned_quantity: 'Planned quantity', target_release_date: 'Target release date',
  component_specifications: 'Component specifications', artwork_delivery_specifications: 'Artwork delivery specifications',
  rights_and_permissions: 'Rights and permissions', prototype_results: 'Prototype results', supplier_quotes: 'Supplier quotes',
  costing_and_pricing: 'Costing and pricing', fulfilment_plan: 'Fulfilment plan', publication_assets: 'Publication and campaign assets',
  launch_decision: 'Launch decision', next_action: 'Next action',
};
const recordKeys = new Set(['id', 'project_id', 'owner_id', 'created_by', 'created_at', 'updated_at', 'version_number', 'restored_from_version_id']);
const importKeys = new Set([
  'studio_companion_v1',
  'namespace', 'source_path', 'source_type', 'source_system', 'source_key', 'source_checksum', 'source_archive_checksum',
  'source_frontmatter', 'source_raw_markdown', 'source_body_markdown', 'storage_path', 'imported_at', 'last_seen_at',
  'checksum', 'sha256', 'md5', 'target_id', 'target_type',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sourceControlKeys = new Set([
  'title', 'status', 'seed', 'card_id', 'card_number', 'group_number', 'position_in_group', 'revision_count',
  'word_count_target', 'toc_position', 'toc_section', 'chapter_type', 'chapter_subtype', 'first_drafted', 'last_edited',
  'published', 'is_hua', 'is_navigator', 'is_conceptual', 'is_nga_manu_huri', 'is_nga_manu_huri_entry',
  'has_secondary_bird', 'bird_slug', 'bird_oracle_page', 'related_card_slug', 'secondary_bird_slug',
  'tarot_primary_slug', 'tarot_second_slug', 'tarot_third_slug', 'tarot_primary_number', 'tarot_second_number',
  'tarot_third_number', 'tarot_number', 'image', 'image_type', 'image_status',
]);
export function readableLabel(key: string): string {
  return labels[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replaceAll('-', ' ').replace(/^./, c => c.toUpperCase());
}

/** Preserve arbitrary author fields as labelled prose instead of dumping their JSON. */
function authorFields(value: unknown, key: string, label: string): ReadableField[] {
  if (value === null || value === undefined) return [{ key, label, value: '' }];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const structured = JSON.parse(trimmed);
        if (structured && typeof structured === 'object') return authorFields(structured, key, label);
      } catch { /* Ordinary author text containing brackets remains author text. */ }
    }
    return [{ key, label, value }];
  }
  if (typeof value === 'number' || typeof value === 'boolean') return [{ key, label, value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) }];
  if (Array.isArray(value)) return value.flatMap((item, i) => authorFields(item, `${key}.${i}`, label ? `${label} · ${i + 1}` : `Item ${i + 1}`));
  if (typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([child, item]) => {
    // Source frontmatter can contain genuine writing as well as import controls.
    // Keep author notes/unknown author fields as labelled text, never its raw object.
    if (child === 'source_frontmatter' && item && typeof item === 'object' && !Array.isArray(item)) {
      return Object.entries(item).flatMap(([name, sourceValue]) => {
        if (sourceControlKeys.has(name) || importKeys.has(name) || sourceValue === null || (typeof sourceValue === 'string' && !sourceValue.trim())) return [];
        if ((recordKeys.has(name) || name.endsWith('_id')) && typeof sourceValue === 'string' && uuid.test(sourceValue)) return [];
        return authorFields(sourceValue, `${key}.source-writing.${name}`, `Original source notes · ${readableLabel(name)}`);
      });
    }
    if (importKeys.has(child)) return [];
    if ((recordKeys.has(child) || child.endsWith('_id')) && typeof item === 'string' && uuid.test(item)) return [];
    // This import namespace is a wrapper, never a user-facing heading. Unknown
    // author additions within it are still retained; only known technical keys go.
    const wrapper = child === 'aotearoa_bird_oracle' || child === 'custom';
    const nextLabel = wrapper ? label : [label, readableLabel(child)].filter(Boolean).join(' · ');
    return authorFields(item, `${key}.${child}`, nextLabel);
  });
}

export function readableFields(snapshot: Record<string, unknown>, kind: ReadableKind, refs: ReadableReferences = {}): ReadableField[] {
  const fields: ReadableField[] = [];
  for (const [key, value] of Object.entries(snapshot)) {
    if (recordKeys.has(key) || importKeys.has(key)) continue;
    if (key === 'content' && kind === 'card' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [name, item] of Object.entries(value)) {
        if (importKeys.has(name)) continue;
        fields.push(...authorFields(name === 'rights_status' && typeof item === 'string' ? rightsReadingText(item) : item, name, name === 'custom' ? '' : readableLabel(name)));
      }
    } else if (key === 'metadata' || key === 'custom') {
      fields.push(...authorFields(value, key, ''));
    } else if (key === 'family_id') {
      fields.push({ key, label: 'Family', value: typeof value === 'string' && value ? refs.families?.[value] ?? 'Family unavailable' : 'No family' });
    } else if (key === 'card_id') {
      fields.push({ key, label: 'Card this section belongs to', value: typeof value === 'string' && value ? refs.cards?.[value] ?? 'Linked card unavailable' : 'General manuscript section' });
    } else if (key.endsWith('_id') && typeof value === 'string' && uuid.test(value)) {
      continue;
    } else {
      fields.push(...authorFields(value, key, readableLabel(key)));
    }
  }
  return fields.filter(field => field.label).map(field => kind === 'guidebook' && field.key === 'sort_order' ? {...field,label:'Manuscript sort position'} : field).map(field => field.key === 'body_markdown' && isLegacyBirdManuscript(snapshot) ? {...field, legacyProse: true} : field);
}

export function fieldsMarkdown(fields: ReadableField[], heading = '##'): string {
  return fields.filter(field => field.value !== '').map(field => `${heading} ${field.label}\n\n${field.legacyProse ? legacyReadingMarkdown(field.value) : field.value}`).join('\n\n');
}
