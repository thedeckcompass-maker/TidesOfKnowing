'use strict';
// Public-key-only negative checks; credentials and response bodies are not logged.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const ref='kcahcrfdubpoajsfxziv',root='https://'+ref+'.supabase.co';
const cfg=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'dcs-acceptance-'+ref+'-public.json'),'utf8'));
assert.equal(cfg.projectRef,ref);assert.equal(cfg.url,root);assert(Date.now()<Date.parse(cfg.deadline),'Acceptance window expired');
const results=[];
async function denied(name,route,body){
 const url=new URL(route,root);assert.equal(url.origin,root);assert(!/vbdqvjvhjleqdadiiqjx|utzcmbidotxgmulguzxo/.test(url.href));
 const response=await fetch(url,{method:'POST',headers:{apikey:cfg.anonKey,authorization:'Bearer '+cfg.anonKey,'content-type':'application/json'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(20000)});
 assert([401,403].includes(response.status),name+' must reject anonymous caller; got '+response.status);results.push({name,status:response.status,pass:true});
}
(async()=>{
 for(const name of ['studio_project_can_read_v1','studio_project_can_edit_v1','studio_project_can_manage_lifecycle_v1'])await denied(name,'/rest/v1/rpc/'+name,{p_project:'10000000-0000-0000-0000-000000000001'});
 await denied('studio_has_write_access','/rest/v1/rpc/studio_has_write_access',{});
 await denied('complimentary grant status','/rest/v1/rpc/studio_complimentary_develop_workspace_active_v1',{});
 const storage=await fetch(root+'/storage/v1/object/list/studio-journal-photos',{method:'POST',headers:{apikey:cfg.anonKey,authorization:'Bearer '+cfg.anonKey,'content-type':'application/json'},body:JSON.stringify({prefix:'',limit:10}),redirect:'error',signal:AbortSignal.timeout(20000)});
 if(storage.status===200)assert.deepEqual(await storage.json(),[],'Anonymous Storage listing exposed objects');else assert([401,403].includes(storage.status));
 results.push({name:'private Storage listing exposes zero objects',status:storage.status,pass:true,limitation:'bucket is currently empty; authenticated object isolation remains pending'});
 const report={target:ref,at:new Date().toISOString(),authenticatedJourney:false,results};fs.writeFileSync('.build-temp/dcs-connected-acceptance-20261118/anonymous-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.name+': '+e.message.replace(/eyJ[A-Za-z0-9_.-]+/g,'[redacted]'));process.exitCode=1;});
