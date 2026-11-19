// Focused integration fixture: exercise the real route/provider/ZIP inspector
// against the actual SQL snapshot in the disposable PostgreSQL database.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import sharp from 'sharp';
export async function checkLexiconExport(pg,ownerId,projectId){
 const out=await build({stdin:{contents:`export {createCoherentProjectExportHandler} from './src/pages/api/studio/projects/[id]/export/[format].ts';export {inspectProjectArchive,readStoredProjectZip} from './src/lib/studio/projectRestore.ts';export {composeProjectExport} from './src/lib/studio/exportComposition.ts';export {preparedExchangeSnapshotProvider} from './src/lib/studio/exchangeSnapshotProvider.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',logLevel:'silent',define:{'import.meta.env':'{}'}});
 const m={exports:{}};new Function('module','exports','require',out.outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));const api=m.exports;
 const photo=await sharp({create:{width:4,height:4,channels:3,background:'#008080'}}).jpeg().toBuffer();
 const journal=(await pg.query('select id from studio_journal_entries where project_id=$1 limit 1',[projectId])).rows[0].id;
 await pg.query("insert into studio_journal_photos(id,project_id,journal_entry_id,storage_path,sort_order) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',$1,$2,$3,0)",[projectId,journal,`${ownerId}/${projectId}/synthetic.jpg`]);
 const names=new Set(['studio_project_can_read_v1','studio_project_export_snapshot_v1','studio_exchange_export_snapshot_v1']);
 let captures=0;
 const client={auth:{getUser:async()=>({data:{user:{id:ownerId}},error:null})},rpc:async(name,args)=>{
  assert.ok(names.has(name));try{if(name==='studio_project_export_snapshot_v1')captures++;return {data:(await pg.query(`select public.${name}($1) value`,[args.p_project])).rows[0].value,error:null};}catch(e){return {data:null,error:e};}
 },from(table){assert.equal(table,'profiles');const q={select(){return q;},eq(){return q;},maybeSingle:async()=>({data:{id:ownerId,status:'active'},error:null})};return q;},storage:{from(){return {download:async()=>({data:new Blob([photo],{type:'image/jpeg'}),error:null})};}}};
 const providers=api.composeProjectExport(client,{enabled:true,exchangeProvider:api.preparedExchangeSnapshotProvider(client)});
 const locals={...providers,user:{id:ownerId},profile:{id:ownerId,status:'active',role:'member'},supabase:client,studioSupportLocal:false,studioArtistLocal:false};
 const response=await api.createCoherentProjectExportHandler()({params:{id:projectId,format:'zip'},locals});
 assert.equal(response.status,200,await response.clone().text());assert.equal(captures,2);
 const bytes=new Uint8Array(await response.arrayBuffer());const archive=await api.inspectProjectArchive(bytes);
 assert.equal(archive.counts.cards,22);assert.equal(archive.data.journal.length,3);assert.equal(archive.omissions.length,0);
 assert.ok(archive.data.cards.some(c=>c.deleted_at));assert.ok(archive.counts.card_versions>=22);
 const files=api.readStoredProjectZip(bytes);const imagePath=[...files.keys()].find(k=>k.startsWith('media/journal/'));assert.ok(imagePath);assert.deepEqual(Buffer.from(files.get(imagePath)),photo);
 const changing={...providers.studioProjectSnapshotProvider,capture:async(...args)=>{const value=await providers.studioProjectSnapshotProvider.capture(...args);if(++changing.calls===2)value.tables.studio_projects[0].settings.changed='synthetic concurrent change';return value;},calls:0};
 const conflict=await api.createCoherentProjectExportHandler(changing)({params:{id:projectId,format:'zip'},locals});assert.equal(conflict.status,409);
 const foreign=await api.createCoherentProjectExportHandler()({params:{id:projectId,format:'zip'},locals:{...locals,user:{id:projectId}}});assert.equal(foreign.status,403);
}
