import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(
  'src/scripts/studioCommunityReplyActions.ts','utf8'
);
const compiled=ts.transpileModule(source,{
  compilerOptions:{
    module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022
  }
}).outputText;

const replyId='11111111-1111-4111-8111-111111111111';

function harness({
  action='edit',
  confirmed=true,
  response={ok:true,id:replyId},
  validity=true
}={}){
  const listeners={};
  const textarea={
    value:'My revised comment',
    focused:false,
    focus(){this.focused=true;}
  };
  const button={disabled:false};
  const status={hidden:true,textContent:''};
  const fields=new Map([
    ['action',action],
    ['reply_id',replyId],
    ['body',textarea.value],
    ['expected_updated_at','2026-11-03T12:00:00Z']
  ]);

  const form={
    action:'/api/studio/community-member-actions',
    reportValidity:()=>validity,
    querySelector(selector){
      if(selector.includes('textarea'))return textarea;
      if(selector.includes('button'))return button;
      return status;
    },
    addEventListener(name,handler){listeners[name]=handler;}
  };

  let requests=0;
  let reloads=0;
  let confirmations=0;

  class MockFormData{
    constructor(){
      this.values=new Map(fields);
      this.values.set('body',textarea.value);
    }
    get(key){return this.values.get(key)??null;}
  }

  const context={
    exports:{},
    document:{querySelectorAll:()=>[form]},
    FormData:MockFormData,
    fetch:async()=>{
      requests++;
      if(response instanceof Error)throw response;
      return {
        ok:response.ok,
        json:async()=>response
      };
    },
    window:{
      confirm:()=>{
        confirmations++;
        return confirmed;
      },
      location:{reload(){reloads++;}}
    },
    AbortSignal,Error,Promise,RegExp
  };

  vm.runInNewContext(compiled,context);

  return {
    textarea,button,status,
    get requests(){return requests;},
    get reloads(){return reloads;},
    get confirmations(){return confirmations;},
    async submit(){
      let prevented=false;
      await listeners.submit({
        preventDefault(){prevented=true;}
      });
      assert.equal(prevented,true);
    }
  };
}

test('Successful edit reloads the conversation',async()=>{
  const h=harness();
  await h.submit();
  assert.equal(h.requests,1);
  assert.equal(h.reloads,1);
  assert.equal(h.button.disabled,false);
});

test('Rejected edit preserves the revised text',async()=>{
  const h=harness({
    response:{ok:false,error:'Revision changed'}
  });
  await h.submit();
  assert.equal(h.textarea.value,'My revised comment');
  assert.equal(h.textarea.focused,true);
  assert.equal(h.reloads,0);
  assert.match(h.status.textContent,/Revision changed/);
});

test('Invalid success receipt cannot confirm an edit',async()=>{
  const h=harness({
    response:{ok:true,id:'invalid'}
  });
  await h.submit();
  assert.equal(h.reloads,0);
  assert.equal(h.textarea.value,'My revised comment');
});

test('Cancelling deletion makes no request',async()=>{
  const h=harness({action:'delete',confirmed:false});
  await h.submit();
  assert.equal(h.confirmations,1);
  assert.equal(h.requests,0);
  assert.equal(h.reloads,0);
});

test('Confirmed deletion calls API and reloads',async()=>{
  const h=harness({action:'delete',confirmed:true});
  await h.submit();
  assert.equal(h.confirmations,1);
  assert.equal(h.requests,1);
  assert.equal(h.reloads,1);
});

test('Failed deletion does not claim success',async()=>{
  const h=harness({
    action:'delete',
    response:{ok:false,error:'Deletion rejected'}
  });
  await h.submit();
  assert.equal(h.requests,1);
  assert.equal(h.reloads,0);
  assert.match(h.status.textContent,/Deletion rejected/);
});

test('Network error preserves edited text and retry',async()=>{
  const h=harness({
    response:new Error('Network unavailable')
  });
  await h.submit();
  assert.equal(h.textarea.value,'My revised comment');
  assert.equal(h.button.disabled,false);
  assert.equal(h.reloads,0);
});

test('Invalid form prevents submission',async()=>{
  const h=harness({validity:false});
  await h.submit();
  assert.equal(h.requests,0);
});
