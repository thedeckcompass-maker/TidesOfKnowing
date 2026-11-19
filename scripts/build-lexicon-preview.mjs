import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const stage=join(root,'.preview-builds','lexicon-'+new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(stage,{recursive:true});
const worker=JSON.parse(await readFile(join(root,'wrangler.lexicon-preview.json'),'utf8'));
if(worker.name!=='tidesofknowing-dcs-lexicon-preview'||worker.vars.PUBLIC_SUPABASE_URL!=='https://utzcmbidotxgmulguzxo.supabase.co'||worker.keep_vars!==false||worker.workers_dev!==false||worker.preview_urls!==false||worker.routes.length)throw Error('PREVIEW_BUILD_CONFIG_INVALID');
// Vite needs a source entry during compilation; the generated deployment
// config will reference its compiled entry inside this isolated output.
await writeFile(join(stage,'wrangler.json'),JSON.stringify({...worker,main:join(root,'src/worker.ts').replaceAll('\\','/')},null,2));
const baseUrl=new URL('../astro.config.mjs',import.meta.url).href;
const adapterUrl=new URL('../node_modules/@astrojs/cloudflare/dist/index.js',import.meta.url).href;
const config=`import base from ${JSON.stringify(baseUrl)};\nimport cloudflare from ${JSON.stringify(adapterUrl)};\nexport default {...base,root:'.',srcDir:'../../src/',publicDir:'../../public/',outDir:'./dist/',cacheDir:'./cache/',vite:{...base.vite,envDir:false},adapter:cloudflare({configPath:'./wrangler.json',imageService:'compile',prerenderEnvironment:'node',remoteBindings:false})};\n`;
await writeFile(join(stage,'astro.config.mjs'),config);
// Do not inherit credentials, provider activation flags or workspace .env files.
const env={};
for(const key of ['SystemRoot','WINDIR','PATH','Path','PATHEXT','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA'])if(process.env[key])env[key]=process.env[key];
Object.assign(env,{CI:'true',WRANGLER_LOG_PATH:join(stage,'wrangler.log'),WRANGLER_SEND_METRICS:'false',PUBLIC_SUPABASE_URL:worker.vars.PUBLIC_SUPABASE_URL,PUBLIC_SUPABASE_ANON_KEY:'',STUDIO_RUNTIME_ENABLED:'false',STUDIO_BILLING_TEST_ENABLED:'false',STUDIO_BILLING_LIVE_ENABLED:'false',STUDIO_BILLING_SCHEDULER_ENABLED:'false'});
console.log('Isolated preview build directory: '+relative(root,stage));
const astroPackage=JSON.parse(await readFile(join(root,'node_modules/astro/package.json'),'utf8'));
const child=spawn(process.execPath,[resolve(root,'node_modules/astro',astroPackage.bin.astro),'build','--config','./astro.config.mjs'],{cwd:stage,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
const log=[];child.stdout.on('data',data=>{log.push(data);process.stdout.write(data);});child.stderr.on('data',data=>{log.push(data);process.stderr.write(data);});
const exitCode=await new Promise((done,reject)=>{child.on('error',reject);child.on('exit',done);});
await writeFile(join(stage,'BUILD.log'),Buffer.concat(log));
await writeFile(join(stage,'BUILD-RESULT.json'),JSON.stringify({stage,worker:worker.name,project:'utzcmbidotxgmulguzxo',exitCode,credentialsInherited:false,deployed:false},null,2));
process.exitCode=exitCode??1;
