import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(
  'src/scripts/studioCommunityMemberReplies.ts','utf8'
);
const compiled = ts.transpileModule(source,{
  compilerOptions:{
    module:ts.ModuleKind.None,
    target:ts.ScriptTarget.ES2022
  }
}).outputText;

function harness(fetchResult) {
  const listeners = {};
  const textarea = {
    value:'My original contribution',
    focused:false,
    focus(){this.focused=true;}
  };
  const button = {disabled:false};
  const status = {hidden:true,textContent:''};
  const form = {
    action:'/api/studio/community-member-actions',
    reportValidity:()=>true,
    querySelector(selector){
      if(selector.includes('textarea'))return textarea;
      if(selector.includes('button'))return button;
      return status;
    },
    addEventListener(name,handler){listeners[name]=handler;}
  };
  let reloaded=false;
  let requests=0;

  const context = {
    document:{
      querySelectorAll:()=>[form]
    },
    FormData:class {
      constructor(){this.body=textarea.value;}
    },
    fetch:async()=>{
      requests++;
      return fetchResult();
    },
    window:{
      location:{reload(){reloaded=true;}}
    },
    AbortSignal,
    Error,
    Promise,
    RegExp,
    exports:{}
  };

  vm.runInNewContext(compiled,context);

  return {
    textarea,button,status,
    get reloaded(){return reloaded;},
    get requests(){return requests;},
    submit:async()=>{
      let prevented=false;
      await listeners.submit({
        preventDefault(){prevented=true;}
      });
      assert.equal(prevented,true);
    }
  };
}

test('Confirmed reply clears draft and reloads',async()=>{
  const h=harness(async()=>({
    ok:true,
    json:async()=>({
      id:'11111111-1111-4111-8111-111111111111'
    })
  }));
  await h.submit();
  assert.equal(h.textarea.value,'');
  assert.equal(h.reloaded,true);
  assert.equal(h.requests,1);
  assert.equal(h.button.disabled,false);
});

test('Rejected reply preserves the original writing',async()=>{
  const h=harness(async()=>({
    ok:false,
    json:async()=>({error:'Reply not permitted'})
  }));
  await h.submit();
  assert.equal(h.textarea.value,'My original contribution');
  assert.equal(h.reloaded,false);
  assert.equal(h.textarea.focused,true);
  assert.match(h.status.textContent,/not permitted/);
});

test('Unconfirmed response cannot clear writing',async()=>{
  const h=harness(async()=>({
    ok:true,
    json:async()=>({id:'invalid'})
  }));
  await h.submit();
  assert.equal(h.textarea.value,'My original contribution');
  assert.equal(h.reloaded,false);
});

test('Network failure preserves writing and permits retry',async()=>{
  const h=harness(async()=>{
    throw Error('Network unavailable');
  });
  await h.submit();
  assert.equal(h.textarea.value,'My original contribution');
  assert.equal(h.button.disabled,false);
  assert.equal(h.reloaded,false);
});

