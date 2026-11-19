'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>JSON.parse(fs.readFileSync(path.resolve(root,f),'utf8')),policy=read('config/dcs-production-release.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const account=policy.accountId,zone=policy.zoneId,worker=policy.worker,wb=`/accounts/${account}/workers/scripts/${worker}`,pb=`/accounts/${account}/pages/projects/${policy.pages}`,rb=`/zones/${zone}/workers/routes`;
function acquire(){
 if(process.env.CLOUDFLARE_API_TOKEN)return process.env.CLOUDFLARE_API_TOKEN;
 // Existing owner-host secure handoff. Its implementation and credentials stay private.
 const file=process.env.DCS_SECURE_HANDOFF_MODULE||'C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-INDIVIDUAL-ROUTE-AUTOMATION-20261110/secure-handoff.cjs';
 assert.equal(sha(fs.readFileSync(file)),'784e839df57912d95f529fb37c24b4aca3ca90c760f47975b4e209a926044ff9','SECURE_HANDOFF_DRIFT');
 const h=require(file).acquire();assert(h.token,'SECURE_HANDOFF_UNAVAILABLE');const token=h.token;h.token=undefined;return token;
}
function cli(args,cwd,timeout=300000){
 const env={...process.env,CI:'true',WRANGLER_SEND_METRICS:'false',WRANGLER_WRITE_LOGS:'false',WRANGLER_LOG_SANITIZE:'true',CLOUDFLARE_ACCOUNT_ID:account};
 for(const k of ['DEBUG','NODE_DEBUG','NODE_OPTIONS','CLOUDFLARE_ENV','CLOUDFLARE_API_BASE_URL','CF_API_BASE_URL','WRANGLER_OUTPUT_FILE_PATH','WRANGLER_OUTPUT_FILE_DIRECTORY','WRANGLER_CI_OVERRIDE_NAME'])delete env[k];
 return cp.spawnSync(process.execPath,[root+'/node_modules/wrangler/bin/wrangler.js',...args],{cwd,env,windowsHide:true,encoding:'utf8',timeout,maxBuffer:12*1024*1024});
}
async function api(token,p){
 assert([pb,rb,wb+'/deployments',wb+'/subdomain'].includes(p)||p.startsWith(wb+'/versions/')||p.startsWith(pb+'/deployments/'),'READ_SCOPE_REJECTED');
 const r=await fetch('https://api.cloudflare.com/client/v4'+p,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(25000)}),j=await r.json();assert(r.ok&&j.success===true,'CLOUDFLARE_READ_FAILED');return j.result;
}
const deployed=async t=>(await api(t,wb+'/deployments')).deployments[0],at100=(d,v)=>d.versions.length===1&&d.versions[0].version_id===v&&d.versions[0].percentage===100;
async function routes(t){const live=await api(t,rb);assert.equal(live.length,13,'ROUTE_COUNT_DRIFT');assert.equal(policy.routes.length,13);for(const e of policy.routes)assert(live.some(x=>x.id===e.id&&x.pattern===e.pattern&&x.script===e.script),'ROUTE_DRIFT');return live;}
function safeFailure(e){return {category:/^[A-Z_]+$/.test(e.message)?e.message:'VALIDATION_OR_PROCESS_FAILED',...(typeof e.status==='number'?{status:e.status}:{})};}
module.exports={fs,path,cp,assert,root,read,policy,sha,account,zone,worker,wb,pb,rb,acquire,cli,api,deployed,at100,routes,safeFailure};
