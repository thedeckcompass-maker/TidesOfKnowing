import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(
  'src/scripts/studioCommunityNotifications.ts','utf8'
);
const compiled=ts.transpileModule(source,{
  compilerOptions:{
    module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022
  }
}).outputText;

const ids=[
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
];

function harness({activities=[],loadFails=false,acknowledges=true}={}){
  const list={
    children:[],
    replaceChildren(){this.children=[];},
    append(node){this.children.push(node);}
  };
  const count={hidden:true,textContent:''};
  const status={textContent:''};
  const root={
    querySelector(selector){
      if(selector.includes('activity-list'))return list;
      if(selector.includes('unread-count'))return count;
      return status;
    }
  };
  const requests=[];
  const destinations=[];

  function element(tag){
    return {
      tag,
      dataset:{},
      listeners:{},
      children:[],
      append(...nodes){this.children.push(...nodes);},
      addEventListener(name,fn){this.listeners[name]=fn;},
      setAttribute(name,value){this[name]=value;}
    };
  }

  const context={
    exports:{},
    document:{
      querySelector:()=>root,
      createElement:element
    },
    fetch:async(url,options={})=>{
      requests.push({url,options});
      if(options.method==='POST'){
        return {
          ok:acknowledges,
          json:async()=>({acknowledged:acknowledges})
        };
      }
      return {
        ok:!loadFails,
        json:async()=>({activities})
      };
    },
    window:{
      location:{assign(url){destinations.push(url);}}
    },
    AbortSignal,FormData,Date,Set,RegExp,
    encodeURIComponent,Error,Promise,String
  };

  vm.runInNewContext(compiled,context);

  return {
    list,count,status,requests,destinations,
    async settle(){
      for(let attempt=0;attempt<20;attempt++){
        if(status.textContent!=='')return;
        await new Promise(resolve=>setImmediate(resolve));
      }
      throw new Error('Notification controller did not finish loading.');
    }
  };
}

function activity(id,capability,read_at=null){
  return {
    id,post_id:id,reply_id:id,
    activity_type:'reply',
    chapter:'spark',capability,
    created_at:'2026-11-03T12:00:00Z',
    read_at
  };
}

test('Counts unread notifications',async()=>{
  const h=harness({activities:[
    activity(ids[0],'general_community'),
    activity(ids[1],'private_community','2026-11-03T13:00:00Z')
  ]});
  await h.settle();
  assert.equal(h.count.textContent,'1 unread');
  assert.equal(h.list.children.length,2);
});

test('Separates General and Private Community links',async()=>{
  const h=harness({activities:[
    activity(ids[0],'general_community'),
    activity(ids[1],'private_community')
  ]});
  await h.settle();
  const links=h.list.children.map(item=>item.children[0].href);
  assert.match(links[0],/^\/studio\/community\/\?chapter=spark#discussion-/);
  assert.match(links[1],/^\/studio\/private-community\/\?chapter=spark#discussion-/);
});

test('Acknowledges before navigating',async()=>{
  const h=harness({activities:[
    activity(ids[0],'general_community')
  ]});
  await h.settle();
  const link=h.list.children[0].children[0];
  let prevented=false;
  await link.listeners.click({
    button:0,ctrlKey:false,metaKey:false,
    shiftKey:false,altKey:false,
    preventDefault(){prevented=true;}
  });
  assert.equal(prevented,true);
  assert.equal(h.count.hidden,true);
  assert.equal(h.destinations.length,1);
  assert.equal(h.requests.at(-1).options.method,'POST');
});

test('Failed notification loading shows an unavailable state',async()=>{
  const h=harness({loadFails:true});
  await h.settle();
  assert.equal(h.status.textContent,
    'Community notifications are unavailable.');
  assert.equal(h.list.children.length,0);
});

test('Invalid activity records are not rendered',async()=>{
  const h=harness({activities:[{
    ...activity(ids[0],'general_community'),
    post_id:'invalid'
  }]});
  await h.settle();
  assert.equal(h.list.children.length,0);
});





