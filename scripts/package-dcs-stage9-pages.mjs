// Packaging only: reuse the accepted compiled application in an existing Pages preview.
// Never invokes deployment, changes a binding, reads a secret or creates a hosted resource.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'.build-temp/stage9-2026-11-17T18-17-44-360Z');
const hash=b=>createHash('sha256').update(b).digest('hex');
const expectedManifest='7e9baf0cec5640cccbbd2f8d5d13f053adfb29e4b4c7163ce87b72f35d957d78';
const manifestBytes=fs.readFileSync(path.join(source,'ARTIFACT-MANIFEST.json'));
if(hash(manifestBytes)!==expectedManifest)throw Error('ACCEPTED_ARTIFACT_MANIFEST_CHANGED');
const receipt=JSON.parse(fs.readFileSync(path.join(source,'BUILD-RESULT.json')));
if(receipt.state!=='BUILT_LOCAL_STAGE9_CANDIDATE'||!receipt.sourceUnchanged||!receipt.cloudflareBuildVerified||receipt.deployed)throw Error('BUILD_EVIDENCE_INVALID');
for(const item of JSON.parse(manifestBytes)){
 const p=path.resolve(root,item.path);
 if(!p.startsWith(path.join(source,'dist')+path.sep)||hash(fs.readFileSync(p))!==item.sha256)throw Error('COMPILED_ARTIFACT_CHANGED');
}
const stage=path.join(root,'.build-temp','stage9-pages-'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(stage);const output=path.join(stage,'public'),worker=path.join(output,'_worker.js');
// Isolate Pages' config discovery from the workspace's generated Worker target.
// This config is for local validation, NOT an approved hosted binding profile.
fs.writeFileSync(path.join(stage,'wrangler.json'),JSON.stringify({name:'dcs-stage9-pages-local',pages_build_output_dir:'./public',compatibility_date:'2026-04-01',compatibility_flags:['nodejs_compat'],vars:{STUDIO_RUNTIME_ENABLED:'false',STUDIO_BILLING_TEST_ENABLED:'false',STUDIO_BILLING_LIVE_ENABLED:'false',STUDIO_BILLING_SCHEDULER_ENABLED:'false'}},null,2));
fs.mkdirSync(path.join(stage,'.wrangler/deploy'),{recursive:true});
fs.writeFileSync(path.join(stage,'.wrangler/deploy/config.json'),JSON.stringify({configPath:'../../wrangler.json'}));
fs.cpSync(path.join(source,'dist/client'),output,{recursive:true,errorOnExist:true,force:false});fs.mkdirSync(worker);
function copyModules(from,to){for(const e of fs.readdirSync(from,{withFileTypes:true})){const a=path.join(from,e.name),b=path.join(to,e.name);if(e.isDirectory()){fs.mkdirSync(b);copyModules(a,b);}else if(e.isFile()&&e.name.endsWith('.mjs'))fs.copyFileSync(a,b,fs.constants.COPYFILE_EXCL);else if(!e.isFile())throw Error('UNEXPECTED_ARTIFACT_LINK');}}
copyModules(path.join(source,'dist/server'),worker);
// Pages advanced mode uses index.js in a _worker.js directory. Preserve all compiled imports.
// Omit the scheduled billing handler: acceptance has no cron/financial-provider authority.
fs.writeFileSync(path.join(worker,'index.js'),"import app from './entry.mjs';\nexport default {fetch(request,env,ctx){return app.fetch(request,env,ctx)}};\n",{flag:'wx'});
fs.writeFileSync(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:[]}),{flag:'w'});
const packageFiles=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else packageFiles.push({path:path.relative(output,p).replaceAll('\\','/'),sha256:hash(fs.readFileSync(p))});}}walk(output);
fs.writeFileSync(path.join(stage,'PACKAGE-MANIFEST.json'),JSON.stringify(packageFiles,null,2));
const result={state:'PACKAGED_LOCAL_PAGES_CANDIDATE',source:receipt.directory,output:path.relative(root,output).replaceAll('\\','/'),existingProject:'tidesofknowing',existingPreviewBranch:'feature/deck-creator-studio-live',excludedProductionBranch:'main',entrySha256:hash(fs.readFileSync(path.join(worker,'entry.mjs'))),packageManifestSha256:hash(fs.readFileSync(path.join(stage,'PACKAGE-MANIFEST.json'))),deployed:false,hostedBindingsVerified:false,hostedAcceptance:false};
fs.writeFileSync(path.join(stage,'PACKAGE-RESULT.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
