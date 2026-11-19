import type { SupabaseClient } from '@supabase/supabase-js';
export const PUBLIC_MEMBER_FALLBACK='Community member';
export function publicUsername(value: string|null|undefined): string {
 return value || PUBLIC_MEMBER_FALLBACK;
}
export async function getCommunityUsername(client:SupabaseClient,userId:string):Promise<string|null>{
 const {data,error}=await client.from('community_usernames').select('username').eq('user_id',userId).maybeSingle();
 return error?null:data?.username??null;
}
export async function withPublicAuthors(client:SupabaseClient,rows:Record<string,unknown>[],field='author_id'){
 const ids=[...new Set(rows.map(r=>String(r[field]??'')).filter(Boolean))];
 if(!ids.length)return rows;
 const {data,error}=await client.from('community_usernames').select('user_id,username').in('user_id',ids);
 const names=new Map((error?[]:data??[]).map((r:{user_id:string;username:string})=>[r.user_id,r.username]));
 return rows.map(row=>({...row,[field==='reporter_user_id'?'reporter':'author']:{id:row[field],username:names.get(String(row[field]))??null}}));
}
