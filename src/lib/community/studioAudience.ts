export type CommunityAudience =
  | 'public_commons'
  | 'general_community'
  | 'private_community';

const audiences: Record<string, CommunityAudience> = {
  'reading-practice': 'public_commons',
  'reader-development': 'public_commons',
  'studio-general': 'general_community',
  'studio-general-qa': 'general_community',
  'deck-creator-studio': 'private_community',
  'studio-private-qa': 'private_community',
};

export function communityAudienceForSection(
  sectionKey: string
): CommunityAudience | null {
  return audiences[sectionKey] ?? null;
}

/**
 * Resolve the persisted audience of a post or reply.
 * Classification only. Authorisation remains separate.
 */
export async function resolveCommunityAudience(
  client: any,
  kind: 'post' | 'reply',
  id: string
): Promise<CommunityAudience | null> {
  let postId = id;

  if (kind === 'reply') {
    const reply = await client.from('community_replies')
      .select('post_id').eq('id', id).maybeSingle();

    if (reply.error) throw Error('Community reply lookup failed.');
    if (!reply.data) return null;
    postId = reply.data.post_id;
  }

  const post = await client.from('community_posts')
    .select('section_id').eq('id', postId).maybeSingle();

  if (post.error) throw Error('Community post lookup failed.');
  if (!post.data) return null;

  const section = await client.from('community_sections')
    .select('key,is_active')
    .eq('id', post.data.section_id).maybeSingle();

  if (section.error) throw Error('Community section lookup failed.');
  if (!section.data || section.data.is_active !== true) return null;

  return communityAudienceForSection(section.data.key);
}
