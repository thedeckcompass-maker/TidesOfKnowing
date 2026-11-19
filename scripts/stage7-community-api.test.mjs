import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(
  'src/pages/api/studio/community-member-actions.ts','utf8'
);

const compiled=ts.transpileModule(source,{
  compilerOptions:{
    module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022
  }
}).outputText;

let validOrigin=true;
let oversized=false;
const calls=[];

const provider={
  memberReply:async(who,input)=>{
    calls.push({action:'reply',who,input});
    return '11111111-1111-4111-8111-111111111111';
  },
  memberEditReply:async(who,input)=>{
    calls.push({action:'edit',who,input});
    return input.replyId;
  },
  memberDeleteReply:async(who,input)=>{
    calls.push({action:'delete',who,input});
    return input.replyId;
  }
};

const module={exports:{}};

vm.runInNewContext(compiled,{
  module,
  exports:module.exports,
  require(name){
    if(name==='../../../lib/studio/access')
      return {sameOriginMutation:()=>validOrigin};
    if(name==='../../../lib/studio/limitedForm')
      return {limitedForm:async(request)=>{
        if(oversized)throw Error('Request too large');
        return request.form;
      }};
    throw Error('Unexpected import: '+name);
  },
  Response,
  JSON,
  String,
  Error,
  Promise
});

const {POST}=module.exports;
const who='22222222-2222-4222-8222-222222222222';
const replyId='33333333-3333-4333-8333-333333333333';

function context(fields={},overrides={}){
  return {
    request:{form:new Map(Object.entries(fields))},
    locals:{
      user:{id:who},
      profile:{id:who,status:'active'},
      studioSupportHostedEnabled:true,
      studioSupportLocal:false,
      studioCommunityMemberActionsEnabled:true,
      studioSupportProvider:provider,
      ...overrides
    }
  };
}

async function result(ctx){
  const response=await POST(ctx);
  return {status:response.status,body:await response.json()};
}

test('Rejects cross-origin mutation',async()=>{
  validOrigin=false;
  try{
    assert.equal((await result(context())).status,403);
  }finally{validOrigin=true;}
});

test('Rejects inactive member',async()=>{
  const r=await result(context({},{
    profile:{id:who,status:'inactive'}
  }));
  assert.equal(r.status,401);
});

test('Rejects disabled member actions',async()=>{
  const r=await result(context({},{
    studioCommunityMemberActionsEnabled:false
  }));
  assert.equal(r.status,503);
});

test('Rejects local demonstration mode',async()=>{
  const r=await result(context({},{
    studioSupportLocal:true
  }));
  assert.equal(r.status,503);
});

test('Rejects missing hosted provider',async()=>{
  const r=await result(context({},{
    studioSupportProvider:null
  }));
  assert.equal(r.status,503);
});

test('Routes a top-level reply correctly',async()=>{
  const r=await result(context({
    action:'reply',
    post_id:replyId,
    body:'A considered response',
    submission_key:who
  }));
  assert.equal(r.status,200);
  assert.equal(calls.at(-1).action,'reply');
  assert.equal(calls.at(-1).input.parentId,null);
});

test('Preserves parent ID for nested reply',async()=>{
  const r=await result(context({
    action:'reply',
    post_id:replyId,
    parent_id:who,
    body:'A child reply',
    submission_key:replyId
  }));
  assert.equal(r.status,200);
  assert.equal(calls.at(-1).input.parentId,who);
});

test('Routes edits with revision',async()=>{
  const revision='2026-11-03T12:00:00Z';
  const r=await result(context({
    action:'edit',
    reply_id:replyId,
    body:'Revised response',
    expected_updated_at:revision
  }));
  assert.equal(r.status,200);
  assert.equal(calls.at(-1).input.expectedUpdatedAt,revision);
});

test('Routes soft deletion with revision',async()=>{
  const r=await result(context({
    action:'delete',
    reply_id:replyId,
    expected_updated_at:'2026-11-03T12:00:00Z'
  }));
  assert.equal(r.status,200);
  assert.equal(calls.at(-1).action,'delete');
});

test('Rejects unknown actions',async()=>{
  assert.equal((await result(context({action:'unknown'}))).status,400);
});

test('Rejects oversized requests',async()=>{
  oversized=true;
  try{
    const r=await result(context({action:'reply'}));
    assert.equal(r.status,409);
    assert.match(r.body.error,/not confirmed/);
  }finally{oversized=false;}
});

test('Does not report failed provider writes as successful',async()=>{
  const failing={
    ...provider,
    memberReply:async()=>{throw Error('Database rejected write');}
  };
  const r=await result(context({
    action:'reply',post_id:replyId,body:'Test',submission_key:who
  },{studioSupportProvider:failing}));
  assert.equal(r.status,409);
  assert.equal(r.body.id,undefined);
});
