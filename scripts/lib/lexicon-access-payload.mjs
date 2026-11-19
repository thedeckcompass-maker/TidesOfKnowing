// Preparation only. No provider client or hosted mutation pathway.
export function lexiconAccessPayload(intent,worker,sessionDuration){
 if(intent.accountId!=='bd6ec7740077c69b954f70cf9aa61c95'||intent.workerName!=='tidesofknowing-dcs-lexicon-preview'||intent.hostname!=='tidesofknowing-dcs-lexicon-preview.tidesofknowing.workers.dev')throw Error('LEXICON_TARGET_REQUIRED');
 if(worker.accountId!==intent.accountId||worker.name!==intent.workerName||! /^[a-f0-9]{32}$/i.test(worker.id??'')||worker.id==='5ee425a3d2ad4ff7996ab3683ccd6ced')throw Error('DEDICATED_WORKER_METADATA_REQUIRED');
 if(intent.destinationType!=='worker'||intent.trafficScope!=='all'||intent.decision!=='allow'||JSON.stringify(intent.include)!==JSON.stringify([{email:{email:'hello@tidesofknowing.com'}}]))throw Error('OWNER_ONLY_ALL_TRAFFIC_REQUIRED');
 if(!/^[1-9]\d*(?:m|h)$/.test(sessionDuration??''))throw Error('REVIEWED_SESSION_DURATION_REQUIRED');
 return {
  type:'self_hosted',name:intent.applicationName,domain:intent.hostname,
  destinations:[{type:'worker',worker_id:worker.id}],
  session_duration:sessionDuration,app_launcher_visible:false,
  policies:[{name:intent.policyName,decision:'allow',precedence:1,include:[{email:{email:'hello@tidesofknowing.com'}}]}]
 };
}
