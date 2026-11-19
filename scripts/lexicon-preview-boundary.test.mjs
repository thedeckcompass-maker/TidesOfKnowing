import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPreviewBoundary,importLexiconPreview} from './lib/lexicon-local-executor.mjs';
import {spawnSync} from 'node:child_process';
const auth='AUTHORIZE PREVIEW LEXICON utzcmbidotxgmulguzxo';
const connectionParameters={host:'db.utzcmbidotxgmulguzxo.supabase.co',database:'postgres',ssl:{rejectUnauthorized:true}};
test('preview boundary requires approval, exact host, TLS and server marker',async()=>{
 let calls=0;
 const client={connectionParameters,query:async()=>{calls++;return {rowCount:1,rows:[{project_ref:'utzcmbidotxgmulguzxo',ssl:true}]};}};
 await assert.rejects(verifyPreviewBoundary(client,''),/AUTHORIZATION/);assert.equal(calls,0);
 await assert.rejects(verifyPreviewBoundary({...client,connectionParameters:{...connectionParameters,host:'db.vbdqvjvhjleqdadiiqjx.supabase.co'}},auth),/TLS_CONNECTION/);assert.equal(calls,0);
 await assert.rejects(verifyPreviewBoundary({...client,connectionParameters:{...connectionParameters,ssl:{rejectUnauthorized:false}}},auth),/TLS_CONNECTION/);
 await verifyPreviewBoundary(client,auth);
 await assert.rejects(verifyPreviewBoundary({...client,query:async()=>({rowCount:1,rows:[{project_ref:'wrong',ssl:true}]})},auth),/SERVER_IDENTITY/);
});
test('unregistered or non-isolated preview owner cannot start import',async()=>{
 let writes=0;
 const client={connectionParameters,query:async(sql)=>{
  if(sql.startsWith('select e.project_ref'))return {rowCount:1,rows:[{project_ref:'utzcmbidotxgmulguzxo',ssl:true}]};
  if(sql.startsWith('select 1 from dcs_demo.preview_owners'))return {rowCount:0,rows:[]};
  writes++;throw Error('UNEXPECTED_QUERY');
 }};
 await assert.rejects(importLexiconPreview(client,{}, {authorization:auth,ownerId:'unused',projectId:'unused'}),/OWNER_APPROVAL/);
 assert.equal(writes,0);
});
test('command without explicit approval exits before reading config or connecting',()=>{
 const result=spawnSync(process.execPath,['scripts/import-lexicon-preview.mjs'],{encoding:'utf8',timeout:10000});
 assert.equal(result.status,1);assert.match(result.stderr,/explicit preview mode/);assert.equal(result.stdout,'');
});
