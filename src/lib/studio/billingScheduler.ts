import {studioBillingFromEnvironment} from './billingEnvironment';
/** Worker scheduled handler only: no public HTTP endpoint, browser identity or new secret. */
export async function runStudioBillingSchedule(env:Record<string,unknown>,scheduledTime:number,compose=studioBillingFromEnvironment){
 if(env.STUDIO_BILLING_SCHEDULER_ENABLED!=='true')return {disabled:true};
 if(!Number.isSafeInteger(scheduledTime)||scheduledTime<=0)throw Error('Trusted scheduler timestamp required.');
 const runtime=compose(env);if(!runtime.studioBillingExpiry||!runtime.studioBillingDueOwners)throw Error('Billing scheduler configuration unavailable.');
 const runId='hour_'+Math.floor(scheduledTime/3600000);let cursor='',processed=0;const failed:string[]=[];
 for(let page=0;page<100;page++){const owners=await runtime.studioBillingDueOwners(cursor);if(!Array.isArray(owners)||owners.length>100||owners.some((id:string)=>!/^[a-f0-9-]{36}$/.test(id)||id<=cursor))throw Error('Invalid scheduler owner page.');
  for(const owner of owners){try{await runtime.studioBillingExpiry(owner,runId);processed++;}catch{failed.push(owner);}}
  if(owners.length<100){if(failed.length)throw Error('Some billing expirations require retry; no creator content was changed.');return {processed};}cursor=owners[owners.length-1];
 }
 throw Error('Scheduler owner limit exceeded; resume with a reviewed batch configuration.');
}
