'use strict';
const crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
module.exports=async(c,prepare)=>{
 c.ensure();const ref='kcahcrfdubpoajsfxziv';assert.equal(c.config.projectRef,ref);
 if(prepare){
  assert(!c.sessions.executorDatabase,'Test database credential already prepared');
  const password=crypto.randomBytes(36).toString('base64url'),salt=crypto.randomBytes(16),salted=crypto.pbkdf2Sync(password,salt,4096,32,'sha256');
  const clientKey=crypto.createHmac('sha256',salted).update('Client Key').digest(),storedKey=crypto.createHash('sha256').update(clientKey).digest(),serverKey=crypto.createHmac('sha256',salted).update('Server Key').digest();
  const verifier='SCRAM-SHA-256$4096:'+salt.toString('base64')+'$'+storedKey.toString('base64')+':'+serverKey.toString('base64');
  c.sessions.executorDatabase={password};return {role:'dcs_acceptance_executor_login',verifier};
 }
 assert(c.sessions.executorDatabase?.password,'Temporary test login not prepared');
 const {Client}=require('pg'),caFile=path.resolve(c.evidence,'supabase-root-ca.crt'),connectionString='postgresql://dcs_acceptance_executor_login:'+encodeURIComponent(c.sessions.executorDatabase.password)+'@db.'+ref+'.supabase.co:5432/postgres?sslmode=verify-full&sslrootcert='+encodeURIComponent(caFile);
 const bundle=require('esbuild').buildSync({entryPoints:['src/lib/studio/cloudflareServiceConnection.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});
 const runtime=new Module('acceptance-service-connection',module);runtime.filename=path.resolve('acceptance-service-connection.cjs');runtime.paths=module.paths;runtime._compile(bundle.outputFiles[0].text,runtime.filename);
 const connection=runtime.exports.cloudflareServiceConnection({connectionString},c.users.explore.id,s=>{const client=new Client({connectionString:s,connectionTimeoutMillis:8000,query_timeout:15000});const connect=client.connect.bind(client);client.connect=async()=>{try{return await connect();}catch(e){c.results.push({name:'Restricted login connection diagnostic',pass:false,stage:'connect',code:typeof e.code==='string'?e.code:'unclassified'});c.save();throw e;}};return client;});
 const check=await connection.transaction(async q=>{const r=await q('select current_user as effective_role,id from public.studio_projects order by id');assert.equal(r.rows.length,1);assert.equal(r.rows[0].effective_role,'dcs_service_executor');assert.equal(r.rows[0].id,'11000000-0000-0000-0000-000000000002');return {rows:r.rows.length};});
 await assert.rejects(()=>connection.transaction(q=>q("update public.studio_projects set name='forbidden executor mutation' where id=$1",['11000000-0000-0000-0000-000000000002'])));
 await assert.rejects(()=>connection.transaction(q=>q('select public.studio_manage_complimentary_develop_workspace_v1($1,$2,null)',[c.users.develop.id,'revoke'])));
 const after=await connection.transaction(async q=>(await q('select id from public.studio_projects order by id')).rows);assert.equal(after.length,check.rows);
 c.results.push({name:'Real restricted database login through actual cloudflareServiceConnection: verified actor scope, commit, denied mutation/grant operation, rollback and reconnect',pass:true});c.save();return {passed:true};
};
