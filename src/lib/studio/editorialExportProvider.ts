import type { SupabaseClient } from '@supabase/supabase-js';
import { localSupport } from './contextualSupport';
import { prepareAuthenticatedEditorialStore, type EditorialSourceLinks } from './editorialPersistence';
import { buildEditorialArchive, bindEditorialSources, validateEditorialArchive, type EditorialArchive } from './editorialArchive';

export type EditorialExportInput = { ownerId: string; projectId: string; links: EditorialSourceLinks; priorArchive?: unknown };
export type EditorialHistoryProvider = (input: EditorialExportInput) => Promise<EditorialArchive | undefined>;

async function combine(input: EditorialExportInput, current?: EditorialArchive) {
  const prior = await validateEditorialArchive(input.priorArchive, input.ownerId, input.projectId);
  if (current) await validateEditorialArchive(current, input.ownerId, input.projectId);
  if (!prior && !current) return undefined;
  const result = structuredClone(current ?? prior!);
  const origin = (r: EditorialArchive['records'][number]) => [r.evidence.origin_owner_id, r.evidence.origin_project_id, r.evidence.origin_request_id].join(':');
  for (const record of prior?.records ?? []) {
    const existing = result.records.find(r => origin(r) === origin(record));
    if (!existing) result.records.push(structuredClone(record));
    else if (existing.sha256 !== record.sha256) throw Error('Saved and archived editorial evidence disagree. No incomplete backup was issued.');
  }
  await validateEditorialArchive(result, input.ownerId, input.projectId);
  return bindEditorialSources(result, input.links.cards, input.links.sections, input.links.cardVersions, input.links.sectionVersions, input.links.visualBoard);
}

/** Default route keeps the existing local gate. No hosted fallback or new flag. */
export function localEditorialHistoryProvider(locals: unknown): EditorialHistoryProvider {
  return async input => {
    const support = localSupport(locals);
    if (!support) return combine(input);
    const owned = await support.exportOwner(input.ownerId, input.projectId);
    const archive = await buildEditorialArchive(owned.requests, owned.replies, input.ownerId, input.projectId);
    return combine(input, archive);
  };
}

/** Explicit composition only. Not selected by the deployed/default route.
 * Uses the existing adapter's session identity and single snapshot RPC.
 */
export function preparedEditorialHistoryProvider(client: SupabaseClient): EditorialHistoryProvider {
  const store = prepareAuthenticatedEditorialStore(client);
  return async input => combine(input, await store.exportOwner(input.projectId, input.links));
}

/** Validate injected output too; a failed provider never falls back to older history. */
export async function readEditorialExport(provider: EditorialHistoryProvider, input: EditorialExportInput) {
  const archive = await provider(input);
  if (archive === undefined) {
    if (input.priorArchive != null) throw Error('Existing private history was not returned.');
    return undefined;
  }
  await validateEditorialArchive(archive, input.ownerId, input.projectId);
  return archive;
}
