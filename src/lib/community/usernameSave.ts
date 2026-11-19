import { usernameError } from './usernameRules';
export async function savePublicUsername(client: any, userId: string, draft: string) {
  const invalid = usernameError(draft);
  if (invalid) return {ok:false, error:invalid, status:400};
  if (!client) return {ok:false,error:'Username saving is temporarily unavailable. Your entry has been kept.',status:503};
  const {data,error} = await client.rpc('claim_community_username',{requested_username:draft.trim()});
  if (error) return {ok:false,status:400,error:error.code==='23505'?'That username is already taken. Choose another.':error.code==='P0001'?error.message:'Your username was not saved. Your entry has been kept; please try again later.'};
  const verified = await client.from('community_usernames').select('username').eq('user_id',userId).maybeSingle();
  if (typeof data !== 'string' || verified.error || verified.data?.username !== data) return {ok:false,status:503,error:'The save response arrived, but the saved username could not be confirmed. Your entry is kept. Refresh your account before trying again.'};
  return {ok:true,username:data,status:200};
}
export async function usernameFormAction(request: Request, client: any, userId: string, returnPath: string) {
  const json = request.headers.get('accept')?.includes('application/json');
  const draftForm = await request.formData();
  const draft = String(draftForm.get('username') ?? '');
  const result = request.headers.get('origin') !== new URL(request.url).origin
    ? {ok:false,error:'This request could not be verified. Reload your account page before trying again.',status:403}
    : draftForm.get('intent') !== 'choose-username'
      ? {ok:false,error:'Choose a username using the account form.',status:400}
      : await savePublicUsername(client,userId,draft);
  const destination = returnPath + (returnPath.includes('?')?'&':'?') + 'usernameSaved=1#community-username-settings';
  if(json) return {response:new Response(JSON.stringify({...result,...(result.ok?{redirectTo:destination}:{})}),{status:result.status,headers:{'Cache-Control':'private, no-store','Content-Type':'application/json; charset=utf-8'}}),draft,error:result.ok?'':result.error};
  if(result.ok) return {response:new Response(null,{status:303,headers:{Location:destination,'Cache-Control':'private, no-store'}}),draft,error:''};
  return {response:null,draft,error:result.error,status:result.status};
}
