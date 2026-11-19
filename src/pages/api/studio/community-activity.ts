import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';

export const prerender = false;

const json = (value:unknown,status=200) =>
  new Response(JSON.stringify(value),{
    status,
    headers:{
      'Content-Type':'application/json',
      'Cache-Control':'private, no-store'
    }
  });

function providerFor(locals:any){
  if(!locals.user ||
     locals.profile?.id!==locals.user.id ||
     locals.profile?.status!=='active')return null;

  if(locals.studioSupportHostedEnabled!==true ||
     locals.studioSupportLocal===true ||
     locals.studioCommunityActivityEnabled!==true)return null;

  const provider=locals.studioSupportProvider;
  if(!provider ||
     typeof provider.memberActivityRead!=='function' ||
     typeof provider.memberActivityAck!=='function')return null;

  return provider;
}

export const GET:APIRoute=async({locals})=>{
  if(!locals.user ||
     locals.profile?.id!==locals.user.id ||
     locals.profile?.status!=='active'){
    return json({error:'Sign in with an active Studio account.'},401);
  }

  const provider=providerFor(locals);
  if(!provider)return json({error:'Community notifications are not available.'},503);

  try{
    const activities=await provider.memberActivityRead(locals.user.id);
    return json({activities});
  }catch{
    return json({error:'Community notifications could not be loaded.'},503);
  }
};

export const POST:APIRoute=async({request,locals})=>{
  if(!sameOriginMutation(request)){
    return json({error:'Invalid request origin.'},403);
  }

  if(!locals.user ||
     locals.profile?.id!==locals.user.id ||
     locals.profile?.status!=='active'){
    return json({error:'Sign in with an active Studio account.'},401);
  }

  const provider=providerFor(locals);
  if(!provider)return json({error:'Community notifications are not available.'},503);

  try{
    const form=await limitedForm(request,2000);
    if(form.get('action')!=='ack'){
      return json({error:'Unsupported notification action.'},400);
    }

    const activityId=String(form.get('activity_id')??'');
    const acknowledged=await provider.memberActivityAck(
      locals.user.id,
      activityId
    );

    return json({acknowledged});
  }catch{
    return json({error:'Notification acknowledgement was not confirmed.'},409);
  }
};
