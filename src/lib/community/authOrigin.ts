import {communityEnv} from './env';
export const PUBLIC_AUTH_ORIGIN='https://www.tidesofknowing.com';
/** Production credentials must never create email returns to a workers.dev host. */
export function authOrigin(locals:unknown,requestUrl:URL):string{
 return communityEnv(locals).supabaseUrl==='https://vbdqvjvhjleqdadiiqjx.supabase.co'
  ? PUBLIC_AUTH_ORIGIN : requestUrl.origin;
}
