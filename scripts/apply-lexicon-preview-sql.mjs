import {readFile} from 'node:fs/promises';
import {Client} from 'pg';
import {pathToFileURL} from 'node:url';
import {PREVIEW_REF,PREVIEW_DB,previewSslOptions,applyPreviewSql,verifyPreviewConnection,verifyReviewedSql,safePreviewFailure} from './lib/lexicon-preview-sql.mjs';
const files={apply:'../docs/DCS-PREVIEW-DEMO-COMPATIBILITY-20261116.REVIEW.sql',rollback:'../docs/DCS-PREVIEW-DEMO-COMPATIBILITY-20261116.ROLLBACK.review.sql',contracts:'../docs/DCS-PREVIEW-EXPORT-LIFECYCLE-20261116.REVIEW.sql','rollback-contracts':'../docs/DCS-PREVIEW-EXPORT-LIFECYCLE-20261116.ROLLBACK.review.sql',desk:'../docs/DCS-PREVIEW-CREATOR-DESK-20261117.REVIEW.sql','rollback-desk':'../docs/DCS-PREVIEW-CREATOR-DESK-20261117.ROLLBACK.review.sql'};
Object.assign(files,{'stage9-transport':'../docs/DCS-STAGE9-PREVIEW-TRANSPORT-20261117.REVIEW.sql','rollback-stage9-transport':'../docs/DCS-STAGE9-PREVIEW-TRANSPORT-20261117.ROLLBACK.review.sql'});
export async function runPreviewSql(args,{ClientClass=Client,readSql=readFile,password=process.env.PGPASSWORD,write=console.log,writeError=console.error,loadSsl=()=>previewSslOptions({caFile:process.env.DCS_PREVIEW_CA_FILE,caSha256:process.env.DCS_PREVIEW_CA_SHA256,caSource:process.env.DCS_PREVIEW_CA_SOURCE})}={}){
 const [mode,direction,sha256,authorization]=args;
 let client,stage='LOCAL_INPUT',failed=false;
 const onStage=value=>{stage=value;};
 try{
  if(!['--check-connection','--validate','--commit'].includes(mode)||!Object.hasOwn(files,direction)||authorization!==`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`||!password)throw Error('PRIVATE_CREDENTIAL_AND_EXPLICIT_APPROVAL_REQUIRED');
  stage='SQL_FILE';
  const sql=await readSql(new URL(files[direction],import.meta.url),'utf8');
  const options={projectRef:PREVIEW_REF,authorization,sql,sha256,onStage};
  stage='SQL_REVIEW';verifyReviewedSql(options);
  stage='TLS_CONFIGURATION';
  if(process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw Error('TLS_BYPASS_REJECTED');
  const ssl=await loadSsl();
  if(ssl.rejectUnauthorized!==true||ssl.servername!==PREVIEW_DB.host)throw Error('PINNED_PREVIEW_CONNECTION_REQUIRED');
  stage='CONNECT';
  client=new ClientClass({...PREVIEW_DB,ssl,password,connectionTimeoutMillis:15000});
  await client.connect();
  if(mode==='--check-connection'){
   await verifyPreviewConnection(client,options);
   write(JSON.stringify({projectRef:PREVIEW_REF,state:'CONNECTION_VERIFIED_NO_SQL_APPLIED',sha256}));
  }else{
   write(JSON.stringify(await applyPreviewSql(client,{...options,commit:mode==='--commit'})));
  }
 }catch(error){failed=true;writeError(JSON.stringify(safePreviewFailure(error,stage)));}
 finally{
  if(client)try{await client.end();}catch(error){if(!failed){failed=true;writeError(JSON.stringify(safePreviewFailure(error,'CONNECTION_CLOSE')));}}
 }
 return failed?1:0;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 process.exitCode=await runPreviewSql(process.argv.slice(2));
}
