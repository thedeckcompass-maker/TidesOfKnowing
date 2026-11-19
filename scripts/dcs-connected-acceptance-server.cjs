'use strict';
// Single-project, loopback-only acceptance harness. Secrets remain in RAM.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ref='kcahcrfdubpoajsfxziv',base='https://'+ref+'.supabase.co',port=18761,origin='http://127.0.0.1:'+port;
const config=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'dcs-acceptance-'+ref+'-public.json'),'utf8'));
assert.equal(config.projectRef,ref);assert.equal(config.url,base);
const deadline=Date.parse(config.deadline),evidence=path.resolve('.build-temp/dcs-connected-acceptance-20261118');
let serviceKey=null,busy=false,intakeDiagnostics=null;const users={},sessions={},results=[];
const save=()=>fs.writeFileSync(path.join(evidence,'connected-progress.json'),JSON.stringify({target:ref,at:new Date().toISOString(),deadline:config.deadline,users:Object.fromEntries(Object.entries(users).map(([k,u])=>[k,{id:u.id,email:u.email}])),results},null,2));
const ensure=()=>{assert(Date.now()<deadline,'Acceptance window expired');assert.equal(new URL(base).hostname,ref+'.supabase.co');};
async function api(route,body,{token=serviceKey,method='POST',headers={}}={}){
 ensure();const url=new URL(route,base);assert.equal(url.origin,base);assert(!/vbdqvjvhjleqdadiiqjx|utzcmbidotxgmulguzxo/.test(url.href));
 const response=await fetch(url,{method,headers:{apikey:config.anonKey,authorization:'Bearer '+token,'content-type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(20000)});
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=null}return {status:response.status,data};
}
const ok=(r,name)=>{assert(r.status>=200&&r.status<300,name+' HTTP '+r.status+' '+(r.data?.code||r.data?.error_code||''));return r.data;};
async function provision(){
 assert(serviceKey,'Server binding not loaded');assert.equal(Object.keys(users).length,0,'Identities already provisioned');
 for(const [name,email] of Object.entries({admin:'dcs-acceptance-admin@example.com',explore:'dcs-acceptance-explore@example.com',develop:'hello@thedeckcompass.com',historical:'dcs-acceptance-history@example.com'})){
  const body=ok(await api('/auth/v1/admin/generate_link',{type:'signup',email,password:crypto.randomBytes(32).toString('base64url'),data:{display_name:'Synthetic '+name},options:{redirect_to:'http://localhost:18761/auth/callback/'}}),'Synthetic signup '+name);
  const account=body.user??body,properties=body.properties??body;
  assert(account.id&&properties.hashed_token,'Expected generated signup confirmation');
  users[name]={id:account.id,email};sessions[name]={hash:properties.hashed_token};save();
 }
 results.push({name:'Four isolated Auth signup identities generated without sending email',pass:true});save();
 return {users};
}
async function login(){
 for(const name of Object.keys(users)){
  const body=ok(await api('/auth/v1/verify',{token_hash:sessions[name].hash,type:'email'},{token:config.anonKey}),'Auth email verification '+name);
  assert.equal(body.user?.id,users[name].id);assert(body.access_token&&body.refresh_token,'Expected genuine session');
  sessions[name]={...sessions[name],access:body.access_token,refresh:body.refresh_token};
  const who=ok(await api('/auth/v1/user',undefined,{method:'GET',token:body.access_token}),'Auth user '+name);assert.equal(who.id,users[name].id);
  const profile=ok(await api('/rest/v1/profiles?select=id,role,status&id=eq.'+users[name].id,undefined,{method:'GET',token:body.access_token}),'Own profile '+name);assert.equal(profile.length,1);assert.equal(profile[0].status,'active');
 }
 results.push({name:'Four genuine email-token Auth sessions and own profiles',pass:true,transport:'Auth Admin generated confirmation tokens; no outbound email'});save();return {loggedIn:Object.keys(users)};
}
async function command(body){if(body.operation==='provision')return provision();if(body.operation==='login')return login();if(body.operation==='status')return {bound:!!serviceKey,users,results};
 const file=require.resolve('./dcs-connected-acceptance-tests.cjs');delete require.cache[file];return require(file)({operation:body.operation,users,sessions,results,api,ok,save,ensure,config,evidence,serverBindings:()=>({PUBLIC_SUPABASE_URL:base,PUBLIC_SUPABASE_ANON_KEY:config.anonKey,SUPABASE_SERVICE_ROLE_KEY:serviceKey})});}
const intake=require('./lib/dcs-local-key-intake.cjs')({projectRef:ref,origin,deadline,getBound:()=>!!serviceKey,setBinding:key=>{serviceKey=key;},reportDiagnostics:d=>{intakeDiagnostics=d;}});
const server=http.createServer(async(req,res)=>{
 const send=(status,body,type='application/json')=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store','content-security-policy':"default-src 'none'; form-action 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'"});res.end(typeof body==='string'?body:JSON.stringify(body));};
 try{
  if(await intake(req,res))return;
  if(req.method==='GET'&&req.localPath==='/status')return send(200,{target:ref,bound:!!serviceKey,users:Object.keys(users),results,intakeDiagnostics});
  if(req.localPath!=='/command')return send(404,{error:'Not found'});
  if(req.method!=='POST')return send(405,{error:'Use POST for test commands'});
  if((req.headers['content-type']||'').split(';')[0].trim()!=='application/json')return send(415,{error:'JSON test command required'});
  let text='';for await(const chunk of req){text+=chunk;if(text.length>10000)return send(413,{error:'Command too large'});}
  assert(!busy,'A command is already running');busy=true;try{return send(200,await command(JSON.parse(text)));}finally{busy=false;}
 }catch(e){save();send(500,{error:'Local acceptance request failed; no credential details are returned.'});}
});
server.listen(port,'127.0.0.1',()=>console.log('Acceptance intake ready at '+origin+'/intake; target '+ref+'; no credentials logged.'));
setInterval(()=>{if(Date.now()>=deadline){serviceKey=null;server.close();process.exitCode=2;}},30000).unref();
