'use strict';
// Local packaging only: no Wrangler, credential access, network, or deployment.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {prepareWorkerCommonJsLoader}=require('./worker-commonjs-loader.cjs');
const updated=process.argv.includes('--workspace-grant');
const root=path.resolve('.'),build=path.resolve(updated?'.build-temp/stage9-2026-11-18T19-29-20-453Z':'.build-temp/stage9-2026-11-18T17-58-33-999Z');
const prior='C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-COMMUNITY-PROVIDER-REPAIR-20261113/corrected-candidate';
const out=path.resolve(updated?'.build-temp/dcs-production-worker-candidate-20261118-v6':'.build-temp/dcs-production-worker-candidate-20261118-v2');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const f=path.join(d,e.name);assert(!fs.lstatSync(f).isSymbolicLink(),'SYMLINK_STOP');return e.isDirectory()?walk(f):[f]});
assert(!fs.existsSync(out),'DESTINATION_EXISTS_STOP');
assert.equal(sha(path.join(build,'ARTIFACT-MANIFEST.json')),updated?'d560c3e10b318addaf9e84a5d8541d6ef50ddeb253a03545f3d54b05cacbc21d':'32cd7ba10640a93af7d28a6890c02169b849d515f56294bc6557b49cb13d82e1');
for(const row of read(path.join(build,'ARTIFACT-MANIFEST.json'))){const f=path.resolve(root,row.path);assert(f.startsWith(path.join(build,'dist')+path.sep),'SOURCE_ESCAPE');assert.equal(sha(f),row.sha256,'ACCEPTED_ARTIFACT_DRIFT');}
assert.equal(sha(path.join(prior,'ARTIFACT-MANIFEST.json')),'32f27830dd82e2991bc970b07196c59d8ce8e93d9e8711a66e2a3631b58a44b0');
const priorManifest=read(path.join(prior,'ARTIFACT-MANIFEST.json'));
for(const relative of ['server/dcs-scoped.mjs','server/dcs-scoped-entry.mjs','wrangler.REVIEW.json']){const row=priorManifest.find(x=>x.path===relative);assert(row,'BASELINE_ENTRY_MISSING');assert.equal(sha(path.join(prior,relative)),row.sha256,'BASELINE_DRIFT');}
fs.mkdirSync(out);fs.cpSync(path.join(build,'dist/server'),path.join(out,'server'),{recursive:true,errorOnExist:true,force:false});fs.cpSync(path.join(build,'dist/client'),path.join(out,'client'),{recursive:true,errorOnExist:true,force:false});
const assets={};for(const f of walk(path.join(out,'client'))){const rel='/'+path.relative(path.join(out,'client'),f).replaceAll('\\','/');assets[rel]={bytes:fs.statSync(f).size,sha256:sha(f)};}
fs.writeFileSync(path.join(out,'asset-manifest.json'),JSON.stringify({version:1,namespace:'/_dcs-assets',assets},null,2),{flag:'wx'});
fs.writeFileSync(path.join(out,'server/dcs-assets.mjs'),'export default '+JSON.stringify({version:1,assets})+';\n',{flag:'wx'});
fs.copyFileSync(path.join(prior,'server/dcs-scoped.mjs'),path.join(out,'server/dcs-scoped.mjs'),fs.constants.COPYFILE_EXCL);
const chunks=path.join(out,'server/chunks'),callback=fs.readdirSync(chunks).filter(n=>/^authCallback_.*\.mjs$/.test(n)&&fs.readFileSync(path.join(chunks,n),'utf8').includes('safeAuthCallbackRedirect as a'));assert.equal(callback.length,1,'CALLBACK_EXPORT_DRIFT');
fs.writeFileSync(path.join(out,'server/dcs-scoped-entry.mjs'),fs.readFileSync(path.join(prior,'server/dcs-scoped-entry.mjs'),'utf8').replace(/authCallback_[A-Za-z0-9_-]+\.mjs/,callback[0]),{flag:'wx'});
const runtime=fs.readdirSync(chunks).filter(n=>/^rolldown-runtime_.*\.mjs$/.test(n));assert.equal(runtime.length,1,'RUNTIME_DRIFT');const runtimePath=path.join(chunks,runtime[0]),runtimeSource=fs.readFileSync(runtimePath,'utf8');let patched=false;if(runtimeSource.includes('var __require =')){fs.writeFileSync(runtimePath,prepareWorkerCommonJsLoader(runtimeSource));patched=true;}else assert(!runtimeSource.includes('Calling `require` for'),'UNKNOWN_REQUIRE_LOADER_STOP');
const config=read(path.join(prior,'wrangler.REVIEW.json'));config.main=path.join(out,'server/dcs-scoped-entry.mjs').replaceAll('\\','/');config.base_dir=path.join(out,'server').replaceAll('\\','/');config.assets.directory=path.join(out,'client').replaceAll('\\','/');fs.writeFileSync(path.join(out,'wrangler.REVIEW.json'),JSON.stringify(config,null,2),{flag:'wx'});
const manifest=walk(out).map(f=>({path:path.relative(out,f).replaceAll('\\','/'),sha256:sha(f),bytes:fs.statSync(f).size}));fs.writeFileSync(path.join(out,'ARTIFACT-MANIFEST.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
console.log(JSON.stringify({status:'LOCAL_REVIEW_ONLY_NOT_DEPLOYABLE',directory:out,files:manifest.length,manifestSha256:sha(path.join(out,'ARTIFACT-MANIFEST.json')),usesDeployedAdapter:true,commonJsLoaderPatched:patched,scheduledHandlerRetained:true,productionCompatibilityVerified:false}));
