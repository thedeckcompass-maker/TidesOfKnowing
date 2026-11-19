'use strict';
const c=require('./lib/dcs-production-common.cjs'),{checkSource,buildProduction}=require('./build-dcs-production.cjs');
const {fs,path,assert,policy,root}=c,dir=path.resolve(root,policy.output),phase=process.argv[2];
function run(file,args=[]){const r=c.cp.spawnSync(process.execPath,[root+'/scripts/'+file,...args],{cwd:root,stdio:'inherit',windowsHide:true});assert.equal(r.status,0,'PRODUCTION_TOOL_FAILED');}
function verify(){
 checkSource();const association=c.read(dir+'/source-association.json');
 for(const f of [...association.files,...association.buildInputs,...(association.packagingInputs||[])])assert.equal(c.sha(fs.readFileSync(root+'/'+f.path)),f.sha256,'BUILD_INPUT_DRIFT');
 for(const [base,file,pin]of [[dir+'/worker',dir+'/worker/ARTIFACT-MANIFEST.json','workerManifestSha256'],[dir+'/pages/public',dir+'/pages/PACKAGE-MANIFEST.json','pagesManifestSha256']]){
  assert.equal(c.sha(fs.readFileSync(file)),c.read(dir+'/package-receipt.json')[pin]);
  for(const f of c.read(file)){const bytes=fs.readFileSync(base+'/'+f.path);assert.equal(c.sha(bytes),f.sha256,'PACKAGE_DRIFT');assert.equal(bytes.length,f.bytes);}
 }
 const cfg=c.read(dir+'/worker/wrangler.REVIEW.json'),template=c.read('config/wrangler.production.json');
 for(const k of ['name','account_id','compatibility_date','compatibility_flags','keep_vars','workers_dev','preview_urls','vars','hyperdrive','secrets','rules','no_bundle'])assert.deepEqual(cfg[k],template[k],'PRODUCTION_CONFIGURATION_DRIFT');
 assert.equal(cfg.assets.run_worker_first,true);assert.equal(cfg.keep_vars,true);assert(!cfg.routes&&!cfg.triggers,'ROUTES_AND_TRIGGERS_ARE_PRESERVED_NOT_DEPLOYED');
 assert.equal(cfg.hyperdrive.length,1);for(const k of ['STUDIO_BILLING_LIVE_ENABLED','STUDIO_BILLING_TEST_ENABLED','STUDIO_BILLING_SCHEDULER_ENABLED'])assert.equal(cfg.vars[k],'false');
 assert(!Object.keys(cfg.vars).some(k=>/REALTIMEKIT|RECORDING|TRANSCRIPTION|STUDIO_VIDEO/.test(k)));
 const built=fs.readFileSync(dir+'/build/local-folder-prototype/desktopArtwork.ts');assert.equal(c.sha(built),c.read('config/dcs-production-dependencies.json').desktopArtworkSha256);
 assert.equal(c.sha(fs.readFileSync(dir+'/worker/server/dcs-scoped.mjs')),c.read('config/dcs-production-dependencies.json').routingAdapterSha256);
 assert.equal(c.sha(fs.readFileSync(dir+'/pages/public/_worker.js/index.js')),c.read('config/dcs-production-dependencies.json').pagesAdapterSha256);
 const result={passed:true,applicationSourceUnchanged:true,artworkDependencyCopiedAndPinned:true,localFolderIntegrationNotEnabled:true,canonicalProductionConfiguration:true,allThirteenRoutesPreservedByPolicy:policy.routes.length===13,providersNotActivated:true};
 fs.writeFileSync(dir+'/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
try{
 if(phase==='check'){checkSource();console.log('Accepted application and artwork dependency verified.');}
 else if(phase==='build'){if(fs.existsSync(dir)){verify();console.log('Existing frozen pair verified; choose a fresh policy.output for a new build.');}else{buildProduction();run('package-dcs-production.cjs');verify();}}
 else if(phase==='verify')verify();
 else if(phase==='dry-run'){verify();const r=c.cli(['deploy','--dry-run','--config',dir+'/worker/wrangler.REVIEW.json','--no-bundle','--outdir',dir+'/dry-run'],require('os').tmpdir(),120000);fs.writeFileSync(dir+'/dry-run.json',JSON.stringify({passed:r.status===0,exitCode:r.status,hostedWrites:0},null,2));assert.equal(r.status,0,'DRY_RUN_FAILED');console.log('Exact-package dry run passed; no upload or deployment.');}
 else if(['preflight','stage','worker','pages','rollback'].includes(phase)){if(phase!=='preflight')assert(process.argv.includes('--approval')&&process.argv[process.argv.indexOf('--approval')+1],'SEPARATE_RELEASE_APPROVAL_REQUIRED');verify();run('release-dcs-production.cjs',process.argv.slice(2));}
 else throw Error('USE_CHECK_BUILD_VERIFY_DRY_RUN_PREFLIGHT_OR_SEPARATELY_APPROVED_STAGE_WORKER_PAGES_ROLLBACK');
}catch(e){console.error(JSON.stringify({passed:false,...c.safeFailure(e)}));process.exitCode=1;}
