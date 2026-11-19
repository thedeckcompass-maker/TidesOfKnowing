// Local consolidated build only. No deployment command, credentials or remote bindings.
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const stage=join(root,'.build-temp','stage9-'+new Date().toISOString().replace(/[:.]/g,'-'));
const hash=b=>createHash('sha256').update(b).digest('hex');
async function inventory(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())result.push(...await inventory(p));else if(e.isFile())result.push({path:relative(root,p).replaceAll('\\','/'),sha256:hash(await readFile(p))});else throw Error('Unexpected source link: '+relative(root,p));}return result.sort((a,b)=>a.path.localeCompare(b.path));}
const source=await inventory(join(root,'src'));
for(const name of ['astro.config.mjs','package.json','package-lock.json','scripts/build-dcs-stage9.mjs'])source.push({path:name,sha256:hash(await readFile(join(root,name)))});
await mkdir(stage,{recursive:true});
// Astro's dependency crawler needs the authoritative package context at its build root.
// This is metadata only; packages resolve to the existing parent node_modules, without install.
await writeFile(join(stage,'package.json'),await readFile(join(root,'package.json')));
await writeFile(join(stage,'SOURCE-MANIFEST.json'),JSON.stringify(source,null,2));
const worker={name:'dcs-stage9-local-candidate',main:join(root,'src/worker.ts').replaceAll('\\','/'),compatibility_date:'2026-04-01',compatibility_flags:['nodejs_compat'],workers_dev:false,preview_urls:false,keep_vars:false,routes:[],assets:{binding:'ASSETS',run_worker_first:true},vars:{STUDIO_RUNTIME_ENABLED:'false',STUDIO_BILLING_LIVE_ENABLED:'false',STUDIO_BILLING_TEST_ENABLED:'false',STUDIO_BILLING_SCHEDULER_ENABLED:'false'}};
await writeFile(join(stage,'wrangler.json'),JSON.stringify(worker,null,2));
const base=new URL('../astro.config.mjs',import.meta.url).href,adapter=new URL('../node_modules/@astrojs/cloudflare/dist/index.js',import.meta.url).href;
await writeFile(join(stage,'astro.config.mjs'),`import base from ${JSON.stringify(base)};import cloudflare from ${JSON.stringify(adapter)};export default {...base,root:'.',srcDir:'../../src/',publicDir:'../../public/',outDir:'./dist/',cacheDir:'./cache/',vite:{...base.vite,envDir:false,plugins:[...(base.vite?.plugins??[]),{name:'dcs-content-commonjs',configEnvironment(name){if(name==='astro')return {optimizeDeps:{include:['yaml','picomatch']}}}}]},adapter:cloudflare({configPath:'./wrangler.json',imageService:'compile',prerenderEnvironment:'node',remoteBindings:false})};\n`);
const env={};for(const key of ['SystemRoot','WINDIR','PATH','Path','PATHEXT','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA'])if(process.env[key])env[key]=process.env[key];
Object.assign(env,{CI:'true',ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:join(stage,'wrangler.log'),PUBLIC_SUPABASE_URL:'',PUBLIC_SUPABASE_ANON_KEY:'',STUDIO_RUNTIME_ENABLED:'false',STUDIO_BILLING_LIVE_ENABLED:'false',STUDIO_BILLING_TEST_ENABLED:'false',STUDIO_BILLING_SCHEDULER_ENABLED:'false'});
async function run(args){const child=spawn(process.execPath,args,{cwd:stage,env,stdio:['ignore','pipe','pipe'],windowsHide:true}),log=[];child.stdout.on('data',b=>{log.push(b);process.stdout.write(b)});child.stderr.on('data',b=>{log.push(b);process.stderr.write(b)});const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve)});return {exitCode,log:Buffer.concat(log)};}
console.log('Fresh consolidated local build: '+relative(root,stage));
const pkg=JSON.parse(await readFile(join(root,'node_modules/astro/package.json'),'utf8'));
const build=await run([join(root,'node_modules/astro',pkg.bin.astro),'build','--config','./astro.config.mjs']);
await writeFile(join(stage,'BUILD.log'),build.log);
let verified=false,sourceUnchanged=true;
if(build.exitCode===0){const check=await run([join(root,'scripts/verify-cloudflare-build.mjs')]);await writeFile(join(stage,'VERIFY.log'),check.log);verified=check.exitCode===0;}
for(const entry of source)if(hash(await readFile(join(root,entry.path)))!==entry.sha256)sourceUnchanged=false;
const success=build.exitCode===0&&verified&&sourceUnchanged;
if(success)await writeFile(join(stage,'ARTIFACT-MANIFEST.json'),JSON.stringify(await inventory(join(stage,'dist')),null,2));
const receipt={state:success?'BUILT_LOCAL_STAGE9_CANDIDATE':'BUILD_FAILED',directory:relative(root,stage).replaceAll('\\','/'),buildExit:build.exitCode,cloudflareBuildVerified:verified,sourceUnchanged,sourceManifestSha256:hash(await readFile(join(stage,'SOURCE-MANIFEST.json'))),credentialsInherited:false,remoteBindings:false,applicationRuntimeEnabled:false,billingEnabled:false,videoBindings:false,deployed:false,hostedAcceptance:false};
await writeFile(join(stage,'BUILD-RESULT.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));process.exitCode=success?0:1;
