export function usernameError(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9]{2,23}$/.test(value.trim())) return 'Use 3–24 letters and numbers, starting with a letter. Capitals are welcome.';
  if (/^(admin|administrator|moderator|system|support|staff|owner|official|leilia|leigh|tidesofknowing)/i.test(value.trim())) return 'Choose a username that does not imply a staff or system identity.';
  return null;
}
/** Untrusted metadata is only a display preference; the RPC claims for auth.uid(). */
export async function completeRequestedUsername(client: any, user: any, profile: any) {
  if (!profile || profile.username || profile.status !== 'active' || !user?.email_confirmed_at) return profile;
  const wanted = user.user_metadata?.requested_community_username;
  if (usernameError(wanted)) return profile;
  const {data,error} = await client.rpc('claim_community_username',{requested_username:wanted.trim()});
  return !error && typeof data === 'string' ? {...profile, username:data} : profile;
}
