'use strict';
const c=require('./lib/dcs-production-common.cjs'),{pathToFileURL}=require('node:url');
const {fs,path,assert,sha,root,policy}=c,dir=path.resolve(root,policy.output),build=dir+'/build';
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);}
function checkSource(){
 const accepted=c.read(policy.sourceManifest),active=accepted.files.filter(f=>f.status==='recorded-accepted-source');
 const actual=walk(root+'/src').map(p=>path.relative(root,p).replaceAll('\\','/')).filter(p=>!/\.before-|\.stage7-backup$/.test(p));
 assert.deepEqual(actual.sort(),active.map(f=>f.path).sort(),'APPLICATION_FILE_SET_DRIFT');
 for(const f of active)assert.equal(sha(fs.readFileSync(root+'/'+f.path)),f.sha256,'ACCEPTED_APPLICATION_SOURCE_DRIFT');
 assert.equal(sha(fs.readFileSync(root+'/local-folder-prototype/desktopArtwork.ts')),c.read('config/dcs-production-dependencies.json').desktopArtworkSha256,'ARTWORK_DEPENDENCY_DRIFT');
 assert.equal(sha(fs.readFileSync(root+'/scripts/fixtures/lexicon-editorial-demo-20261117.json')),c.read('config/dcs-production-dependencies.json').lexiconFixtureSha256,'LEXICON_FIXTURE_DEPENDENCY_DRIFT');
 assert(!fs.readFileSync(root+'/src/middleware.ts','utf8').includes('studioLocalFolderIntegration'),'DORMANT_INTEGRATION_CHANGED');
 const extra=['local-folder-prototype/desktopArtwork.ts','scripts/fixtures/lexicon-editorial-demo-20261117.json'];
 return [...active,...extra.map(p=>({path:p,sha256:sha(fs.readFileSync(root+'/'+p))}))];
}
function buildProduction(){
 assert(dir.startsWith(root+path.sep+'.build-temp'+path.sep),'OUTPUT_OUTSIDE_PRIVATE_BUILD_ROOT');const source=checkSource();
 assert(!fs.existsSync(dir),'OUTPUT_EXISTS_USE_NEW_REVIEWED_OUTPUT_DIRECTORY');fs.mkdirSync(build,{recursive:true});
 fs.cpSync(root+'/src',build+'/src',{recursive:true,filter:p=>!/\.before-|\.stage7-backup$/.test(p)});
 fs.cpSync(root+'/local-folder-prototype',build+'/local-folder-prototype',{recursive:true});
 fs.mkdirSync(build+'/scripts/fixtures',{recursive:true});
 fs.copyFileSync(root+'/scripts/fixtures/lexicon-editorial-demo-20261117.json',build+'/scripts/fixtures/lexicon-editorial-demo-20261117.json');
 for(const f of ['package.json','tsconfig.json'])fs.copyFileSync(root+'/'+f,build+'/'+f);
 fs.symlinkSync(root+'/node_modules',build+'/node_modules','junction');
 const cfg=c.read('config/wrangler.build.json');cfg.main=build+'/src/worker.ts';fs.writeFileSync(build+'/wrangler.json',JSON.stringify(cfg,null,2));
 const base=pathToFileURL(root+'/astro.config.mjs').href,adapter=pathToFileURL(root+'/node_modules/@astrojs/cloudflare/dist/index.js').href;
 fs.writeFileSync(build+'/astro.config.mjs',`import base from ${JSON.stringify(base)};import cloudflare from ${JSON.stringify(adapter)};export default {...base,root:'.',srcDir:'./src/',publicDir:${JSON.stringify(root+'/public/')},outDir:'./dist/',cacheDir:'./cache/',vite:{...base.vite,envDir:false,plugins:[...(base.vite?.plugins??[]),{name:'dcs-content-commonjs',configEnvironment(name){if(name==='astro')return {optimizeDeps:{include:['yaml','picomatch']}}}}]},adapter:cloudflare({configPath:'./wrangler.json',imageService:'compile',prerenderEnvironment:'node',remoteBindings:false})};`);
 const files=['astro.config.mjs','package.json','package-lock.json','tsconfig.json','config/wrangler.build.json','config/wrangler.production.json','config/dcs-production-release.json'].map(p=>({path:p,sha256:sha(fs.readFileSync(root+'/'+p))}));
 fs.writeFileSync(dir+'/source-association.json',JSON.stringify({baseline:policy.acceptedPacket,changed:[],files:source,buildInputs:files,build},null,2));
 // Whitelist ordinary process variables; no credentials or activation settings are inherited.
 const env={};for(const k of ['SystemRoot','WINDIR','PATH','Path','PATHEXT','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA'])if(process.env[k])env[k]=process.env[k];
 Object.assign(env,{ASTRO_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',WRANGLER_WRITE_LOGS:'false',PUBLIC_SUPABASE_URL:'',PUBLIC_SUPABASE_ANON_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',STUDIO_RUNTIME_ENABLED:'false',STUDIO_BILLING_LIVE_ENABLED:'false',STUDIO_BILLING_TEST_ENABLED:'false',STUDIO_BILLING_SCHEDULER_ENABLED:'false'});
 const r=c.cp.spawnSync(process.execPath,[root+'/node_modules/astro/bin/astro.mjs','build'],{cwd:build,env,windowsHide:true,encoding:'utf8',maxBuffer:24*1024*1024});
 fs.writeFileSync(dir+'/build.log',(r.stdout||'')+(r.stderr||''));fs.writeFileSync(dir+'/build-result.json',JSON.stringify({exitCode:r.status,applicationChanges:0,credentialsInherited:false,externalWrites:0},null,2));assert.equal(r.status,0,'PRODUCTION_BUILD_FAILED');
 console.log(JSON.stringify({passed:true,sourceFiles:source.length,applicationChanges:0,output:policy.output}));
}
module.exports={checkSource,buildProduction};if(require.main===module)buildProduction();
