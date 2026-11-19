import { createHash } from 'node:crypto';

// Pure fixture projection: no database client, credentials, writes or real grants.
const fixtureId = key => {
  const bytes = createHash('sha256').update('dcs-lexicon-local-v1:' + key).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};

export function mapLexiconFixture(fixture, { deckType, pathway } = {}) {
  if (fixture?.seed?.schema !== 'dcs-lexicon-fidelity-v1') throw Error('Unexpected Lexicon source');
  if (!['oracle', 'tarot', 'hybrid'].includes(deckType) || !['personal', 'independent', 'commercial'].includes(pathway)) throw Error('Choose a Studio deck type and pathway for the isolated fixture');
  const s = fixture.seed;
  if (s.cards?.length !== 22 || new Set(s.cards.map(c => c.id)).size !== 22 || !Array.isArray(s.project?.families)) throw Error('Lexicon inventory is incomplete');
  const projectId = fixtureId('project'), ownerId = fixtureId('synthetic-owner');
  const families = s.project.families.map((name, i) => ({id: fixtureId('family:' + i), project_id: projectId, name, description: '', sort_order: i}));
  const cards = s.cards.map((card, i) => {
    if (!families[card.family] || !card.title || !['outline','draft','review','complete'].includes(card.status)) throw Error('Invalid card or family in Lexicon fixture');
    return {id: fixtureId('card:' + card.id), project_id: projectId, family_id: families[card.family].id, title: card.title, card_number: String(card.number), sort_order: i, status: card.status, version_number: card.version, content: {meaning: card.meaning, symbolism: card.symbolism, prompts: [card.reflection, card.practice].filter(Boolean).join('\n\n'), keywords: card.keywords, cautions: card.cautions, custom: {lexicon_demo: {source_id: card.id, aphorism: card.aphorism}}}};
  });
  const sections = s.sections.map((section, i) => {
    if (!['front_matter','instructions','chapter','closing','other','card_entry'].includes(section.kind)) throw Error('Unexpected Guidebook section type');
    return {id: fixtureId('section:' + section.id), project_id: projectId, section_type: section.kind, title: section.title, sort_order: i, status: 'draft', body_markdown: section.body, version_number: section.version, metadata: {custom:{lexicon_demo:{source_id:section.id}}}};
  });
  const visual = s.pillar_work['visual-world'];
  const settings = {visual_direction_v1:{version:1, revision:visual.revision, fields:{...visual.fields}, links:[], sources:[], history:[]}};
  const project = {id:projectId, owner_id:ownerId, name:s.project.name, deck_type:deckType, pathway, status:'writing', deck_size:22, purpose:s.project.purpose, intended_reader:s.project.audience, promise:'', description:s.project.description, next_action:s.project.next_action, current_risk:'', settings, updated_at:'2026-11-14T00:00:00.000Z'};
  const journals = s.journal.map(entry => ({id:fixtureId('journal:'+entry.id), project_id:projectId, title:entry.title, body_markdown:entry.body, source_date:entry.date}));
  return {mode:'LOCAL_FIXTURE_ONLY', requiredEntitlement:'Develop-equivalent isolated test entitlement, to be provisioned only in an approved isolated environment', provenance:fixture.provenance, project, families, cards, sections, journals, preservedUnmapped:{worksheets:s.worksheets, chapters:s.chapters, pillar_work:s.pillar_work, publication:s.publication, outline:s.outline, guidance:s.guidance, community:s.community}};
}
