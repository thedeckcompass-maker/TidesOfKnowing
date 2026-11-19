import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(
  'src/pages/api/studio/community-activity.ts','utf8'
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
const actor='11111111-1111-4111-8111-111111111111';
const activity='22222222-2222-4222-8222-222222222222';

const provider={
  async memberActivityRead(who){
    calls.push({action:'read',who});
    return [{id:activity,post_id:activity,read_at:null}];
  },
  async memberActivityAck(who,id){
    calls.push({action:'ack',who,id});
    return true;
  }
};

const mod={exports:{}};

vm.runInNewContext(compiled,{
  module:mod,
  exports:mod.exports,
  require(name){
    if(name==='../../../lib/studio/access')
      return {sameOriginMutation:()=>validOrigin};
    if(name==='../../../lib/studio/limitedForm')
      return {limitedForm:async request=>{
        if(oversized)throw Error('Request too large');
        return request.form;
      }};
    throw Error('Unexpected import: '+name);
  },
  Response,JSON,String,Error,Promise
});

const {GET,POST}=mod.exports;

function context(fields={},overrides={}){
  return {
    request:{form:new Map(Object.entries(fields))},
    locals:{
      user:{id:actor},
      profile:{id:actor,status:'active'},
      studioSupportHostedEnabled:true,
      studioSupportLocal:false,
      studioCommunityActivityEnabled:true,
      studioSupportProvider:provider,
      ...overrides
    }
  };
}

async function run(handler,ctx){
  const response=await handler(ctx);
  return {status:response.status,body:await response.json()};
}

test('Reads only through authenticated member provider',async()=>{
  const r=await run(GET,context());
  assert.equal(r.status,200);
  assert.equal(r.body.activities.length,1);
  assert.deepEqual(calls.at(-1),{action:'read',who:actor});
});

test('Rejects anonymous notification reads',async()=>{
  assert.equal(
    (await run(GET,context({},{user:null}))).status,401
  );
});

test('Rejects inactive members',async()=>{
  assert.equal(
    (await run(GET,context({},{
      profile:{id:actor,status:'inactive'}
    }))).status,401
  );
});

test('Rejects mismatched profile identity',async()=>{
  assert.equal(
    (await run(GET,context({},{
      profile:{id:activity,status:'active'}
    }))).status,401
  );
});

test('Rejects disabled notification feature',async()=>{
  assert.equal(
    (await run(GET,context({},{
      studioCommunityActivityEnabled:false
    }))).status,503
  );
});

test('Rejects demonstration mode',async()=>{
  assert.equal(
    (await run(GET,context({},{
      studioSupportLocal:true
    }))).status,503
  );
});

test('Rejects missing provider',async()=>{
  assert.equal(
    (await run(GET,context({},{
      studioSupportProvider:null
    }))).status,503
  );
});

test('Rejects cross-origin acknowledgements',async()=>{
  validOrigin=false;
  try{
    assert.equal(
      (await run(POST,context({
        action:'ack',activity_id:activity
      }))).status,403
    );
  }finally{
    validOrigin=true;
  }
});

test('Acknowledges using authenticated member identity',async()=>{
  const r=await run(POST,context({
    action:'ack',activity_id:activity
  }));
  assert.equal(r.status,200);
  assert.equal(r.body.acknowledged,true);
  assert.deepEqual(calls.at(-1),{
    action:'ack',who:actor,id:activity
  });
});

test('Rejects unsupported notification action',async()=>{
  assert.equal(
    (await run(POST,context({action:'delete'}))).status,400
  );
});

test('Rejects oversized acknowledgement request',async()=>{
  oversized=true;
  try{
    assert.equal(
      (await run(POST,context({
        action:'ack',activity_id:activity
      }))).status,409
    );
  }finally{
    oversized=false;
  }
});

test('Does not falsely confirm failed acknowledgement',async()=>{
  const failing={
    ...provider,
    memberActivityAck:async()=>{throw Error('Rejected');}
  };
  const r=await run(POST,context({
    action:'ack',activity_id:activity
  },{studioSupportProvider:failing}));
  assert.equal(r.status,409);
  assert.notEqual(r.body.acknowledged,true);
});

test('Does not expose failed notification reads',async()=>{
  const failing={
    ...provider,
    memberActivityRead:async()=>{throw Error('Rejected');}
  };
  const r=await run(GET,context({},{
    studioSupportProvider:failing
  }));
  assert.equal(r.status,503);
  assert.equal(r.body.activities,undefined);
});
