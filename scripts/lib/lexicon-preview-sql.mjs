import {createHash,X509Certificate} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {checkServerIdentity} from 'node:tls';
export const PREVIEW_REF='utzcmbidotxgmulguzxo';
// Established independently by the Supabase management connection, not by DDL.
export const PREVIEW_DB=Object.freeze({host:`db.${PREVIEW_REF}.supabase.co`,port:5432,database:'postgres',user:'postgres',ssl:Object.freeze({rejectUnauthorized:true,servername:`db.${PREVIEW_REF}.supabase.co`})});

// Trust is scoped to this pinned preview connection, never the global Node or
// Windows store. The owner obtains this PUBLIC certificate independently via
// the authenticated preview dashboard, not from the untrusted database peer.
export async function previewSslOptions({caFile,caSha256,caSource,readCertificate=readFile,now=Date.now()}={}){
 const ssl={...PREVIEW_DB.ssl};
 if(!caFile&&!caSha256&&!caSource)return ssl;
 if(!caFile||!/^\s*[a-fA-F0-9]{64}\s*$/.test(caSha256??'')||caSource!==`SUPABASE_DASHBOARD_${PREVIEW_REF}`)throw Error('PREVIEW_PROVIDER_CA_APPROVAL_REQUIRED');
 let bytes;try{bytes=await readCertificate(caFile);}catch{throw Error('PREVIEW_PROVIDER_CA_FILE_UNAVAILABLE');}
 if(createHash('sha256').update(bytes).digest('hex')!==caSha256.trim().toLowerCase())throw Error('PREVIEW_PROVIDER_CA_HASH_MISMATCH');
 try{
  const pem=bytes.toString('utf8');
  // One independently approved root; no private keys or silently added bundle.
  if(!/^\s*-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----\s*$/.test(pem)||pem.match(/-----BEGIN CERTIFICATE-----/g)?.length!==1||pem.includes('PRIVATE KEY'))throw Error();
  const cert=new X509Certificate(pem);
  if(!cert.ca||!cert.checkIssued(cert)||!cert.verify(cert.publicKey)||!Number.isFinite(Date.parse(cert.validFrom))||!Number.isFinite(Date.parse(cert.validTo))||now<Date.parse(cert.validFrom)||now>=Date.parse(cert.validTo))throw Error();
  ssl.ca=pem;
 }catch{throw Error('PREVIEW_PROVIDER_CA_INVALID');}
 return ssl;
}

export async function verifyPreviewConnection(client,{projectRef,authorization,onStage=()=>{}}){
 onStage('TARGET_CONFIGURATION');
 if(projectRef!==PREVIEW_REF)throw Error('PREVIEW_PROJECT_REQUIRED');
 if(authorization!==`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`)throw Error('PREVIEW_SQL_AUTHORIZATION_REQUIRED');
 const config=client.connectionParameters;
 if(config?.host!==PREVIEW_DB.host)throw Error('PREVIEW_ENDPOINT_REQUIRED');
 if(Number(config.port)!==5432)throw Error('PREVIEW_PORT_REQUIRED');
 if(config.database!=='postgres'||config.user!=='postgres'||config.ssl?.rejectUnauthorized!==true||config.ssl?.servername!==PREVIEW_DB.host)throw Error('PINNED_PREVIEW_CONNECTION_REQUIRED');
 onStage('TLS_PEER');
 const stream=client.connection?.stream;
 if(stream?.encrypted!==true||stream.authorized!==true||typeof stream.getPeerCertificate!=='function'||checkServerIdentity(PREVIEW_DB.host,stream.getPeerCertificate()))throw Error('VERIFIED_TLS_PEER_REQUIRED');
 // The driver has completed authenticated startup. Verify the same backend on
 // which the transaction will run, before any migration-created marker exists.
 onStage('DATABASE_IDENTITY');
 const identity=await client.query('select current_database() db, session_user operator, current_user effective_operator, s.ssl, pg_backend_pid() pid from pg_stat_ssl s where s.pid=pg_backend_pid()');
 const row=identity.rows[0];
 if(identity.rowCount!==1||row.db!=='postgres'||row.operator!=='postgres'||row.effective_operator!=='postgres'||row.ssl!==true||!Number.isInteger(row.pid))throw Error('AUTHENTICATED_PREVIEW_BACKEND_REQUIRED');
 return row;
}

export function verifyReviewedSql({projectRef,authorization,sql,sha256}){
 if(projectRef!==PREVIEW_REF)throw Error('PREVIEW_PROJECT_REQUIRED');
 if(authorization!==`AUTHORIZE PREVIEW SQL ${PREVIEW_REF}`)throw Error('PREVIEW_SQL_AUTHORIZATION_REQUIRED');
 if(createHash('sha256').update(sql).digest('hex')!==sha256)throw Error('REVIEWED_SQL_HASH_REQUIRED');
 if(!/^\s*(?:--[^\n]*\n\s*)*BEGIN;/.test(sql)||! /ROLLBACK;\s*$/.test(sql))throw Error('REVIEW_TRANSACTION_REQUIRED');
}

// Only static categories are returned. Never serialize the original error,
// message, detail, hint, stack, SQL text, connection configuration or certificate.
export function safePreviewFailure(error,stage){
 const internal={
  CONFIGURATION_REQUIRED:'IMPORT_CONFIGURATION_INVALID',
  APPROVED_FIXTURE_HASH_REQUIRED:'APPROVED_FIXTURE_HASH_MISMATCH',
  VERIFIED_PREVIEW_TLS_CONNECTION_REQUIRED:'PREVIEW_CONNECTION_CONFIGURATION_REJECTED',
  PREVIEW_SERVER_IDENTITY_REQUIRED:'DATABASE_IDENTITY_REJECTED',
  PREVIEW_AUTHORIZATION_REQUIRED:'OWNER_AUTHORIZATION_REQUIRED',
  DEDICATED_PREVIEW_OWNER_APPROVAL_REQUIRED:'DEMO_OWNER_BINDING_MISSING',
  PREVIEW_OWNER_NOT_ISOLATED:'DEMO_OWNER_NOT_ISOLATED',
  ACTIVE_DEVELOP_DEMO_OWNER_REQUIRED:'ACTIVE_DEMO_ENTITLEMENT_REQUIRED',
  OWNER_MISMATCH:'DEMO_OWNER_MISMATCH',
  DUPLICATE_DEMO_IMPORT:'DUPLICATE_DEMO_IMPORT_REFUSED',
  PRIVATE_CREDENTIAL_AND_EXPLICIT_APPROVAL_REQUIRED:'LOCAL_INPUT_REQUIRED',
  PREVIEW_PROVIDER_CA_APPROVAL_REQUIRED:'PREVIEW_PROVIDER_CA_APPROVAL_REQUIRED',
  PREVIEW_PROVIDER_CA_FILE_UNAVAILABLE:'PREVIEW_PROVIDER_CA_FILE_UNAVAILABLE',
  PREVIEW_PROVIDER_CA_HASH_MISMATCH:'PREVIEW_PROVIDER_CA_HASH_MISMATCH',
  PREVIEW_PROVIDER_CA_INVALID:'PREVIEW_PROVIDER_CA_INVALID',
  TLS_BYPASS_REJECTED:'TLS_BYPASS_REJECTED',
  PREVIEW_PROJECT_REQUIRED:'PREVIEW_TARGET_REJECTED',
  PREVIEW_SQL_AUTHORIZATION_REQUIRED:'OWNER_AUTHORIZATION_REQUIRED',
  REVIEWED_SQL_HASH_REQUIRED:'REVIEWED_SQL_HASH_MISMATCH',
  REVIEW_TRANSACTION_REQUIRED:'SQL_TRANSACTION_GUARD_REJECTED',
  PINNED_PREVIEW_CONNECTION_REQUIRED:'PREVIEW_CONNECTION_CONFIGURATION_REJECTED',
  PREVIEW_ENDPOINT_REQUIRED:'PREVIEW_ENDPOINT_REJECTED',
  PREVIEW_PORT_REQUIRED:'PREVIEW_PORT_REJECTED',
  VERIFIED_TLS_PEER_REQUIRED:'TLS_PEER_VERIFICATION_FAILED',
  AUTHENTICATED_PREVIEW_BACKEND_REQUIRED:'DATABASE_IDENTITY_REJECTED',
  BACKEND_CHANGED:'DATABASE_BACKEND_CHANGED'
 };
 const codes={
  '28P01':'DATABASE_AUTHENTICATION_FAILED','28000':'DATABASE_AUTHORIZATION_FAILED',
  ENOTFOUND:'DATABASE_DNS_FAILURE',EAI_AGAIN:'DATABASE_DNS_FAILURE',
  ECONNREFUSED:'DATABASE_CONNECTION_REFUSED',ETIMEDOUT:'DATABASE_CONNECTION_TIMEOUT',
  ENETUNREACH:'DATABASE_NETWORK_UNREACHABLE',EHOSTUNREACH:'DATABASE_NETWORK_UNREACHABLE',
  ECONNRESET:'DATABASE_CONNECTION_LOST',EPIPE:'DATABASE_CONNECTION_LOST',
  CERT_HAS_EXPIRED:'TLS_CERTIFICATE_EXPIRED',ERR_TLS_CERT_ALTNAME_INVALID:'TLS_HOSTNAME_MISMATCH',
  SELF_SIGNED_CERT_IN_CHAIN:'TLS_CERTIFICATE_CHAIN_UNTRUSTED',DEPTH_ZERO_SELF_SIGNED_CERT:'TLS_CERTIFICATE_CHAIN_UNTRUSTED',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE:'TLS_CERTIFICATE_CHAIN_UNTRUSTED',UNABLE_TO_GET_ISSUER_CERT_LOCALLY:'TLS_CERTIFICATE_CHAIN_UNTRUSTED',
  '42501':'DATABASE_PERMISSION_DENIED','42P01':'SQL_REQUIRED_RELATION_MISSING',
  '42703':'SQL_REQUIRED_COLUMN_MISSING','42883':'SQL_REQUIRED_FUNCTION_MISSING',
  '42P06':'SQL_EXISTING_SCHEMA_CONFLICT','42P07':'SQL_EXISTING_RELATION_CONFLICT',
  '42710':'SQL_EXISTING_OBJECT_CONFLICT','42601':'SQL_SYNTAX_FAILURE',
  '55P03':'DATABASE_LOCK_UNAVAILABLE','57014':'DATABASE_STATEMENT_CANCELLED',
  '23503':'SQL_FOREIGN_KEY_FAILURE','23505':'SQL_UNIQUENESS_FAILURE','23514':'SQL_CHECK_FAILURE'
 };
 const known=Object.hasOwn(internal,error?.message)?internal[error.message]:undefined;
 const coded=Object.hasOwn(codes,error?.code)?codes[error.code]:undefined;
 const fallback=stage==='SQL_FILE'?'LOCAL_SQL_FILE_UNAVAILABLE':stage==='CONNECT'?'DATABASE_CONNECTION_FAILURE_UNCLASSIFIED':stage==='SQL_APPLY'?'SQL_APPLICATION_FAILURE_UNCLASSIFIED':'WRAPPER_RUNTIME_FAILURE_UNCLASSIFIED';
 return {projectRef:PREVIEW_REF,state:'STOP',stage,category:known??coded??fallback};
}

export async function applyPreviewSql(client,{projectRef,authorization,sql,sha256,commit=false,onStage=()=>{}}){
 onStage('SQL_REVIEW');
 verifyReviewedSql({projectRef,authorization,sql,sha256});
 const row=await verifyPreviewConnection(client,{projectRef,authorization,onStage});
 const body=sql.replace(/^(\s*(?:--[^\n]*\n\s*)*)BEGIN;/,'$1').replace(/ROLLBACK;\s*$/,'');
 onStage('TRANSACTION_BEGIN');
 await client.query('BEGIN');
 try{
  await client.query("SET LOCAL lock_timeout='5s'");
  await client.query("SET LOCAL statement_timeout='60s'");
  onStage('BACKEND_PIN');
  const pinned=await client.query('select pg_backend_pid() pid');
  if(pinned.rows[0]?.pid!==row.pid)throw Error('BACKEND_CHANGED');
  onStage('SQL_APPLY');
  await client.query(body);
  onStage(commit?'TRANSACTION_COMMIT':'VALIDATION_ROLLBACK');
  await client.query(commit?'COMMIT':'ROLLBACK');
  return {projectRef:PREVIEW_REF,state:commit?'APPLIED':'VALIDATED_AND_ROLLED_BACK',sha256};
 }catch(error){try{await client.query('ROLLBACK');}catch{/* Preserve the original safe failure category. */}throw error;}
}
