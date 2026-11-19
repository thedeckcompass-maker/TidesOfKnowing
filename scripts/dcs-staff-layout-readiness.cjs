'use strict';
// Read-only observation engine. It has no credentials, CLI, deployment or network capability.
const assert=require('node:assert/strict');
const POLICY=Object.freeze({windowMs:45000,maxRounds:7,intervalMs:5000,operationTimeoutMs:6000,requiredConsecutiveMatches:2});
const REJECTION_SHA='d5823f9c2ffa8c3db62331077874669cb7c65a8f9097b52a4791401ec4986db2';
class ReadinessError extends Error{constructor(category){super(category);this.name='ReadinessError';this.category=category;}}
const fail=category=>{throw new ReadinessError(category);};
async function bounded(fn,ms){const controller=new AbortController();let timer;try{return await Promise.race([Promise.resolve().then(()=>fn(controller.signal)),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new ReadinessError('READINESS_OPERATION_TIMEOUT'));},ms);})]);}finally{clearTimeout(timer);controller.abort();}}
function assetEvidence(raw,asset){
 const sha=typeof raw?.sha256==='string'&&/^[a-f0-9]{64}$/.test(raw.sha256)?raw.sha256:null;
 const status=Number.isInteger(raw?.status)?raw.status:null,bytes=Number.isSafeInteger(raw?.bytes)&&raw.bytes>=0?raw.bytes:null;
 const mime=String(raw?.contentType??'').split(';')[0].trim().toLowerCase();
 return{path:asset.path,status,sha256:sha,bytes,contentType:['text/css','text/plain'].includes(mime)?mime:'OTHER_OR_MISSING',cacheStatus:['HIT','MISS','DYNAMIC','EXPIRED','REVALIDATED','BYPASS','STALE','UPDATING'].includes(raw?.cacheStatus)?raw.cacheStatus:null,cachePolicy:raw?.cachePolicy==='private-no-store'?'private-no-store':raw?.cachePolicy==='public-immutable'?'public-immutable':'OTHER_OR_MISSING'};
}
function classify(sample,asset){
 if(sample.status===200){if(sample.sha256!==asset.sha256)fail('ASSET_HASH_MISMATCH');if(sample.contentType!=='text/css')fail('ASSET_CONTENT_TYPE_MISMATCH');return'MATCH';}
 if(sample.status===404&&sample.sha256===REJECTION_SHA&&sample.bytes===24&&sample.cachePolicy==='private-no-store')return'MANIFEST_REJECTION_PENDING';
 fail('ASSET_UNEXPECTED_RESPONSE');
}
async function verifyReadiness({phase,target,peer,expectedDeploymentId,readState,readAsset,record=()=>{},clock=()=>performance.now(),wait=ms=>new Promise(r=>setTimeout(r,ms)),policy=POLICY}){
 assert(['ACTIVATION','RESTORATION'].includes(phase),'INVALID_PHASE');
 for(const asset of[target,peer]){assert(/^[a-f0-9-]{36}$/.test(asset.version),'INVALID_VERSION');assert(/^\/_dcs-assets\/_astro\/ServiceRecords\.[A-Za-z0-9_-]+\.css$/.test(asset.path),'INVALID_ASSET_PATH');assert(/^[a-f0-9]{64}$/.test(asset.sha256),'INVALID_ASSET_HASH');}
 assert(target.version!==peer.version&&target.path!==peer.path,'INVALID_SENTINEL_PAIR');assert(/^[a-f0-9-]{36}$/.test(expectedDeploymentId),'INVALID_DEPLOYMENT');
 for(const k of Object.keys(POLICY))assert(Number.isInteger(policy[k])&&policy[k]>0&&policy[k]<=POLICY[k],'INVALID_READINESS_BOUND');assert.equal(policy.requiredConsecutiveMatches,2);
 const start=clock(),observations=[];let consecutive=0;
 const remaining=()=>policy.windowMs-(clock()-start);
 const guard=async round=>{
  if(remaining()<=0)fail('READINESS_WINDOW_EXHAUSTED');let state;
  try{state=await bounded(signal=>readState({signal}),Math.min(policy.operationTimeoutMs,remaining()));}catch(error){if(error instanceof ReadinessError)throw error;fail('READINESS_STATE_UNAVAILABLE');}
  const safe={phase,round,kind:'STATE',elapsedMs:Math.max(0,Math.round(clock()-start)),deploymentId:/^[a-f0-9-]{36}$/.test(state?.deploymentId??'')?state.deploymentId:null,versionId:/^[a-f0-9-]{36}$/.test(state?.versionId??'')?state.versionId:null,percentage:typeof state?.percentage==='number'?state.percentage:null,routesMatch:state?.routesMatch===true,pagesMatch:state?.pagesMatch===true,configMatch:state?.configMatch===true,accessProtected:state?.accessProtected===true};observations.push(safe);record(safe);
  if(!safe.routesMatch||!safe.pagesMatch||!safe.configMatch||!safe.accessProtected)fail('READINESS_SECURITY_OR_CONFIGURATION_DRIFT');
  if(safe.deploymentId!==expectedDeploymentId||safe.versionId!==target.version||safe.percentage!==100)fail('READINESS_TRAFFIC_STATE_UNCERTAIN');
  if(remaining()<=0)fail('READINESS_WINDOW_EXHAUSTED');
 };
 try{for(let round=1;round<=policy.maxRounds;round++){
  await guard(round);let pair;try{pair=await bounded(signal=>Promise.all([readAsset(target,{signal}),readAsset(peer,{signal})]),Math.min(policy.operationTimeoutMs,remaining()));}catch(error){if(error instanceof ReadinessError)throw error;fail('READINESS_ASSET_REQUEST_FAILED');}
  const t=assetEvidence(pair[0],target),p=assetEvidence(pair[1],peer),observation={phase,round,kind:'ASSETS',elapsedMs:Math.max(0,Math.round(clock()-start)),target:t,peer:p};observations.push(observation);record(observation);
  const tState=classify(t,target),pState=classify(p,peer);if(remaining()<=0)fail('READINESS_WINDOW_EXHAUSTED');consecutive=tState==='MATCH'?consecutive+1:0;
  if(consecutive>=policy.requiredConsecutiveMatches){await guard(round);const result={phase,status:'READY',targetVersion:target.version,deploymentId:expectedDeploymentId,rounds:round,elapsedMs:Math.max(0,Math.round(clock()-start)),consecutiveMatches:consecutive,peerState:pState,observations};record({phase,kind:'RESULT',status:'READY',rounds:round,consecutiveMatches:consecutive});return result;}
  if(round===policy.maxRounds||remaining()<=policy.intervalMs)fail('READINESS_WINDOW_EXHAUSTED');await wait(policy.intervalMs);
 }fail('READINESS_WINDOW_EXHAUSTED');}catch(error){const category=error instanceof ReadinessError?error.category:'READINESS_LOCAL_VERIFICATION_FAILED';record({phase,kind:'RESULT',status:'STOPPED',category,observedRounds:observations.filter(x=>x.kind==='ASSETS').length});throw new ReadinessError(category);}
}
module.exports={POLICY,REJECTION_SHA,ReadinessError,verifyReadiness};
