// Connection-only diagnostic. No export, object access, DDL, SET ROLE or mutation.
import {Client} from 'pg';
import {X509Certificate} from 'node:crypto';
import {checkServerIdentity} from 'node:tls';
import {pathToFileURL} from 'node:url';
import {PREVIEW_REF,PREVIEW_DB,previewSslOptions,safePreviewFailure} from './lib/lexicon-preview-sql.mjs';
const USER='dcs_exchange_connection';
// GET-only readback of the exact CA selected in the owner's failed form.
const SELECTED_CA='80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA';
export async function checkTransport({ClientClass=Client,password=process.env.PGPASSWORD,write=console.log,loadSsl=()=>previewSslOptions({caFile:process.env.DCS_PREVIEW_CA_FILE,caSha256:process.env.DCS_PREVIEW_CA_SHA256,caSource:process.env.DCS_PREVIEW_CA_SOURCE}),fingerprint=ca=>new X509Certificate(ca).fingerprint256}={}){
 let c,stage='LOCAL_INPUT',code=1;
 try{
  if(!password)throw Error('PRIVATE_CREDENTIAL_AND_EXPLICIT_APPROVAL_REQUIRED');
  stage='TLS_CONFIGURATION';
  if(process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw Error('TLS_BYPASS_REJECTED');
  const ssl=await loadSsl();
  if(ssl.rejectUnauthorized!==true||ssl.servername!==PREVIEW_DB.host||!ssl.ca)throw Error('PINNED_PREVIEW_CONNECTION_REQUIRED');
  if(fingerprint(ssl.ca)!==SELECTED_CA)throw Error('PREVIEW_PROVIDER_CA_HASH_MISMATCH');
  c=new ClientClass({...PREVIEW_DB,user:USER,password,ssl,connectionTimeoutMillis:15000,query_timeout:10000});c.on?.('error',()=>{});
  stage='TARGET_CONFIGURATION';const p=c.connectionParameters;
  if(p.host!==PREVIEW_DB.host||p.user!==USER||p.database!=='postgres'||Number(p.port)!==5432)throw Error('PINNED_PREVIEW_CONNECTION_REQUIRED');
  stage='CONNECT';await c.connect();
  stage='TLS_PEER';const stream=c.connection?.stream;
  if(stream?.encrypted!==true||stream.authorized!==true||typeof stream.getPeerCertificate!=='function'||checkServerIdentity(PREVIEW_DB.host,stream.getPeerCertificate()))throw Error('VERIFIED_TLS_PEER_REQUIRED');
  stage='DATABASE_IDENTITY';
  const r=await c.query("SELECT current_database() db,session_user login,current_user effective_user,s.ssl,has_database_privilege(current_user,current_database(),'CONNECT') can_connect FROM pg_stat_ssl s WHERE s.pid=pg_backend_pid()");
  const v=r.rows[0];if(r.rowCount!==1||v.db!=='postgres'||v.login!==USER||v.effective_user!==USER||v.ssl!==true)throw Error('AUTHENTICATED_PREVIEW_BACKEND_REQUIRED');
  if(v.can_connect!==true){const e=new Error();e.code='42501';throw e;}
  write(JSON.stringify({projectRef:PREVIEW_REF,state:'CONNECTION_VERIFIED_NO_SQL_APPLIED',login:USER,passwordAccepted:true,connectPrivilege:true,tlsVerified:true,selectedCloudflareCaMatches:true}));code=0;
 }catch(e){write(JSON.stringify(safePreviewFailure(e,stage)));}
 finally{if(c)try{await c.end();}catch(e){code=1;write(JSON.stringify(safePreviewFailure(e,'CONNECTION_CLOSE')));}}
 return code;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==2){console.log(JSON.stringify({projectRef:PREVIEW_REF,state:'STOP',stage:'LOCAL_INPUT',category:'LOCAL_INPUT_REQUIRED'}));process.exitCode=1;}
 else process.exitCode=await checkTransport();
}
