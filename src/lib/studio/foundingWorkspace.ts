import {foundingRuntime} from './foundingRuntime';
/** Founding presentation requires an authoritative receipt for this viewer. */
export async function loadFoundingWorkspace(locals:any,url:URL,development:boolean){
 const user=locals.user,profile=locals.profile;
 if(!user||profile?.id!==user.id||profile.status!=='active'||profile.role!=='member')return null;
 const qualifying=(record:any)=>{
  const r=record?.receipt;
  if(record?.userId!==user.id||r?.userId!==user.id)return null;
  const dates=['collaborationStarts','supportEnds','platformEnds','accessExpires'].map(k=>typeof r[k]==='string'?Date.parse(r[k]):NaN);
  return dates.every(Number.isFinite)&&dates[0]<dates[1]&&dates[1]<dates[2]?record:null;
 };
 const runtime=foundingRuntime(locals,url);
 if(runtime){try{return qualifying(await runtime.read(user.id));}catch{return null;}}
 if(!development||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||!locals.foundingWorkspaceProvider)return null;
 try{return qualifying(await locals.foundingWorkspaceProvider.read(user.id));}catch{return null;}
}
