import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lexiconAccessPayload} from './lib/lexicon-access-payload.mjs';
const intent=JSON.parse(await readFile('config/lexicon-preview-access.json','utf8'));
const worker={accountId:intent.accountId,name:intent.workerName,id:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}; // Synthetic ID only.
test('prepared app protects the dedicated Worker stable and preview URLs with its own policy',()=>{
 const app=lexiconAccessPayload(intent,worker,'1h');
 assert.deepEqual(app.destinations,[{type:'worker',worker_id:worker.id}]);
 assert.equal(app.domain,intent.hostname);assert.equal(app.policies.length,1);
 assert.deepEqual(app.policies[0].include,[{email:{email:'hello@tidesofknowing.com'}}]);
 assert.equal(app.policies[0].id,undefined);assert.equal(app.policies[0].decision,'allow');
 assert.equal(app.type,'self_hosted');
});
test('wrong Worker, shared policy scope and extra identities are rejected',()=>{
 for(const changed of [{...worker,name:'tidesofknowing-consolidated'},{...worker,accountId:'other'},{...worker,id:'5ee425a3d2ad4ff7996ab3683ccd6ced'}])assert.throws(()=>lexiconAccessPayload(intent,changed,'1h'));
 assert.throws(()=>lexiconAccessPayload({...intent,destinationType:'preview_worker'},worker,'1h'));
 assert.throws(()=>lexiconAccessPayload({...intent,include:[...intent.include,{email:{email:'admin@tidesofknowing.com'}}]},worker,'1h'));
 assert.throws(()=>lexiconAccessPayload(intent,worker));
});
