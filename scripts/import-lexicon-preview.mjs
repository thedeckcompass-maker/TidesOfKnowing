import {readFile} from 'node:fs/promises';
import {Client} from 'pg';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PREVIEW_REF,PREVIEW_DB,previewSslOptions,verifyPreviewConnection,safePreviewFailure} from './lib/lexicon-preview-sql.mjs';
import {importLexiconPreview,reverseLexiconPreview} from './lib/lexicon-local-executor.mjs';

// Non-secret config identifies the separately approved NEW owner and project.
// Password comes only from a privately prepared ephemeral process environment.
export async function runPreviewImport(args,{ClientClass=Client,readInput=readFile,password=process.env.PGPASSWORD,write=console.log,writeError=console.error,loadSsl=()=>previewSslOptions({caFile:process.env.DCS_PREVIEW_CA_FILE,caSha256:process.env.DCS_PREVIEW_CA_SHA256,caSource:process.env.DCS_PREVIEW_CA_SOURCE}),importer=importLexiconPreview,archiver=reverseLexiconPreview,tlsBypass=process.env.NODE_TLS_REJECT_UNAUTHORIZED}={}){
 const [mode,configPath,authorization]=args;
 let client,stage='LOCAL_INPUT',failed=false;
 const onStage=value=>{stage=value;};
 try{
  if(!['--import','--archive'].includes(mode)||!configPath||authorization!==`AUTHORIZE PREVIEW LEXICON ${PREVIEW_REF}`||!password)throw Error('PRIVATE_CREDENTIAL_AND_EXPLICIT_APPROVAL_REQUIRED');
  if(tlsBypass==='0')throw Error('TLS_BYPASS_REJECTED');
  stage='IMPORT_CONFIGURATION';
  const config=JSON.parse(await readInput(configPath,'utf8'));
  if(config.projectRef!==PREVIEW_REF||config.ownerId!==config.actorId)throw Error('PREVIEW_PROJECT_REQUIRED');
  if(!['ownerId','actorId','projectId','deckType','pathway','projectRef'].every(k=>typeof config[k]==='string'))throw Error('CONFIGURATION_REQUIRED');
  stage='FIXTURE_REVIEW';
  const fixtureBytes=await readInput(new URL('./fixtures/lexicon-demo-20261114.json',import.meta.url));
  if(config.fixtureSha256!==createHash('sha256').update(fixtureBytes).digest('hex'))throw Error('APPROVED_FIXTURE_HASH_REQUIRED');
  // The same dashboard-attested, hash-verified per-connection CA as the SQL wrapper.
  stage='TLS_CONFIGURATION';
  const ssl=await loadSsl();
  if(ssl?.rejectUnauthorized!==true||ssl?.servername!==PREVIEW_DB.host)throw Error('VERIFIED_PREVIEW_TLS_CONNECTION_REQUIRED');
  stage='CONNECT';
  client=new ClientClass({...PREVIEW_DB,password,ssl,connectionTimeoutMillis:15000});
  await client.connect();
  await verifyPreviewConnection(client,{projectRef:PREVIEW_REF,authorization:`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`,onStage});
  const options={...config,authorization,onStage};
  const result=mode==='--import'?await importer(client,JSON.parse(fixtureBytes.toString('utf8')),options):await archiver(client,{...options,approved:true});
  write(JSON.stringify(result));
 }catch(error){
  failed=true;
  writeError(JSON.stringify({...safePreviewFailure(error,stage),receiptCheckRequired:true}));
 }finally{if(client)try{await client.end();}catch(error){if(!failed){failed=true;writeError(JSON.stringify({...safePreviewFailure(error,'CONNECTION_CLOSE'),receiptCheckRequired:true}));}}}
 return failed?1:0;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 process.exitCode=await runPreviewImport(process.argv.slice(2));
}
