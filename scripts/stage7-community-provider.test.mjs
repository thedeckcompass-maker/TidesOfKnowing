import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(
  'src/lib/studio/hostedSupportProvider.ts','utf8'
);
const compiled=ts.transpileModule(source,{
  compilerOptions:{
    module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022
  }
}).outputText;

const mod={exports:{}};
vm.runInNewContext(compiled,{
  module:mod,exports:mod.exports,
  require(name){
    if(name==='./editorialService')
      return {prepareEditorialService:()=>({})};
    if(name==='./communityChapters')
      return {
        isCommunityChapter:c=>c==='spark',
        assertCommunityQuestionMinimum:()=>{}
      };
    throw Error('Unexpected import: '+name);
  },
  Promise,Date,Error
});

const prepare=mod.exports.prepareHostedSupportProvider;
const id='11111111-1111-4111-8111-111111111111';
const post='22222222-2222-4222-8222-222222222222';
const reply='33333333-3333-4333-8333-333333333333';
const key='44444444-4444-4444-8444-444444444444';
const calls=[];

let active=true;
let privateAccess=false;

const client={
  auth:{getUser:async()=>({
    data:{user:{id}},error:null
  })},
  from(table){
    assert.equal(table,'profiles');
    return {
      select(){return this;},
      eq(){return this;},
      async maybeSingle(){
        return {
          data:{id,status:active?'active':'inactive',role:'member'},
          error:null
        };
      }
    };
  },
  async rpc(name,args){
    calls.push({name,args});
    if(name==='studio_dcs_community_member_context_v1')
      return {
        data:{
          id,
          role:'member',
          status:active?'active':'inactive',
          has_username:true,
          general_community:active,
          private_community:active&&privateAccess
        },
        error:null
      };
    if(name==='studio_dcs_community_activity_read_v1')
      return {data:[],error:null};
    if(name==='studio_dcs_community_activity_ack_v1')
      return {data:true,error:null};
    if(name==='studio_dcs_community_submit_v1')
      return {data:{id:post,unchanged:false},error:null};
    return {data:reply,error:null};
  }
};

const provider=prepare(client,{
  enabled:true,
  eligible:async(_,cap)=>
    cap==='general_community'||
    (cap==='private_community'&&privateAccess)
});

test('General Community accepts an active Explore member',async()=>{
  const result=await provider.submit(id,{
    capability:'general_community',
    chapter:'spark',
    reviewed:true,
    project_id:null,
    selected_text:'',
    submission_key:key,
    question:'What should guide this deck?'
  });
  assert.equal(result.id,post);
  assert.equal(calls.at(-1).name,'studio_dcs_community_submit_v1');
});

test('Private Community rejects missing entitlement',async()=>{
  await assert.rejects(
    provider.submit(id,{
      capability:'private_community',
      chapter:'spark',
      reviewed:true,
      project_id:null,
      selected_text:'',
      submission_key:key,
      question:'Private discussion question'
    })
  );
});

test('Member reply uses the reviewed RPC contract',async()=>{
  await provider.memberReply(id,{
    postId:post,parentId:null,
    body:'A useful contribution',key
  });
  assert.equal(calls.at(-1).name,'studio_dcs_community_member_reply_v2');
  assert.equal(calls.at(-1).args.p_post,post);
});

test('Member edit passes the expected revision',async()=>{
  const expectedUpdatedAt='2026-11-03T12:00:00Z';
  await provider.memberEditReply(id,{
    replyId:reply,body:'Revised contribution',expectedUpdatedAt
  });
  assert.equal(calls.at(-1).name,'studio_dcs_community_member_edit_reply_v2');
  assert.equal(calls.at(-1).args.p_expected_updated_at,expectedUpdatedAt);
});

test('Member deletion passes the expected revision',async()=>{
  await provider.memberDeleteReply(id,{
    replyId:reply,expectedUpdatedAt:'2026-11-03T12:00:00Z'
  });
  assert.equal(calls.at(-1).name,'studio_dcs_community_member_delete_reply_v2');
});

test('Member notification read uses recipient-scoped RPC',async()=>{
  const result=await provider.memberActivityRead(id);
  assert.equal(result.length,0);
  assert.equal(calls.at(-1).name,'studio_dcs_community_activity_read_v1');
});

test('Notification acknowledgement validates its identifier',async()=>{
  assert.equal(await provider.memberActivityAck(id,key),true);
  await assert.rejects(provider.memberActivityAck(id,'invalid'));
});

test('Inactive members cannot submit replies',async()=>{
  active=false;
  try{
    await assert.rejects(provider.memberReply(id,{
      postId:post,parentId:null,body:'Test reply',key
    }));
  }finally{
    active=true;
  }
});

test('Disabled provider rejects Community operations',async()=>{
  const disabled=prepare(client,{
    enabled:false,
    eligible:async()=>true
  });
  await assert.rejects(disabled.memberReply(id,{
    postId:post,parentId:null,body:'Test reply',key
  }));
});

