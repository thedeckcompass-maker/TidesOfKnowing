import type {APIRoute} from 'astro';
import {sameOriginMutation} from '../../../lib/studio/access';
import {limitedForm} from '../../../lib/studio/limitedForm';
import {communityAdminStore} from '../../../lib/studio/communityAdmin';
import {inboxId,inboxReturn} from '../../../lib/studio/communityInbox';

export const prerender=false;

const json=(value:unknown,status=200)=>
  new Response(JSON.stringify(value),{
    status,
    headers:{
      'Content-Type':'application/json',
      'Cache-Control':'private, no-store'
    }
  });

export const POST:APIRoute=async({request,locals})=>{
  if(!sameOriginMutation(request)){
    return json({error:'Invalid request origin.'},403);
  }

  if(!locals.user||
     locals.profile?.id!==locals.user.id||
     locals.profile?.status!=='active'){
    return json({error:'Sign in with an active Studio account.'},401);
  }

  if(locals.studioSupportHostedEnabled!==true||
     locals.studioSupportLocal===true||
     locals.studioCommunityMemberActionsEnabled!==true){
    return json({error:'Community member actions are not available.'},503);
  }

  const provider=locals.studioSupportProvider;

  if(!provider||
     typeof provider.memberReply!=='function'||
     typeof provider.memberEditReply!=='function'||
     typeof provider.memberDeleteReply!=='function'){
    return json({error:'Community member service is unavailable.'},503);
  }

  try{
    const form=await limitedForm(request,12000);
    const action=String(form.get('action')??'');
    const who=locals.user.id;

    if(action==='reply'){
      if(form.has('admin_task')){
        const task=String(form.get('admin_task')??''),version=Number(form.get('task_version'));
        if(!inboxId(task)||!Number.isSafeInteger(version)||version<1)throw Error('Invalid task marker.');
        const staff=await communityAdminStore(locals);
        const result=await staff.communityInboxCommand(who,{action:'reply',key:String(form.get('submission_key')??''),replyKey:String(form.get('submission_key')??''),items:[{id:task,version}],post:String(form.get('post_id')??''),parent:form.get('parent_id')?String(form.get('parent_id')):null,body:String(form.get('body')??'')});
        if(!inboxId(result.reply)||result.task!==task||!Number.isSafeInteger(result.taskVersion))throw Error('Task reply receipt unavailable.');
        return json({id:result.reply,task:result.task,taskVersion:result.taskVersion,returnTo:inboxReturn(String(form.get('admin_return')??''))});
      }
      const result=await provider.memberReply(who,{
        postId:String(form.get('post_id')??''),
        parentId:form.get('parent_id')
          ?String(form.get('parent_id'))
          :null,
        body:String(form.get('body')??''),
        key:String(form.get('submission_key')??'')
      });
      return json({id:result});
    }

    if(action==='edit'){
      const result=await provider.memberEditReply(who,{
        replyId:String(form.get('reply_id')??''),
        body:String(form.get('body')??''),
        expectedUpdatedAt:String(
          form.get('expected_updated_at')??''
        )
      });
      return json({id:result});
    }

    if(action==='delete'){
      const result=await provider.memberDeleteReply(who,{
        replyId:String(form.get('reply_id')??''),
        expectedUpdatedAt:String(
          form.get('expected_updated_at')??''
        )
      });
      return json({id:result});
    }

    return json({error:'Unsupported Community action.'},400);
  }catch{
    return json({
      error:'Your Community change was not confirmed. Keep your draft and retry.'
    },409);
  }
};
