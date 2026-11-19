'use strict';
const c=require('./lib/dcs-production-common.cjs'),{fs,assert,policy}=c;
const entries=c.read('docs/archive/dcs-build-profiles-20261119/MANIFEST.json');
for(const e of entries){assert.equal(c.sha(fs.readFileSync(e.archive)),e.sha256);if(e.original!=='wrangler.toml')assert(!fs.existsSync(e.original),'RETIRED_PROFILE_STILL_SELECTABLE');}
assert.equal(entries.length,10);
assert(!fs.existsSync('config/lexicon-preview-import-55d385ed.json'));
assert(!fs.readFileSync('scripts/lexicon-import-diagnostics.test.mjs','utf8').includes('lexicon-preview-import-55d385ed.json'));
assert.equal(c.sha(fs.readFileSync('local-folder-prototype/desktopArtwork.ts')),c.read('config/dcs-production-dependencies.json').desktopArtworkSha256);
const root=fs.readFileSync('wrangler.toml','utf8');assert(root.includes('dcs-build-only-do-not-deploy'));assert(!root.includes('tidesofknowing-consolidated'));assert(!/^(?:main|pages_build_output_dir|account_id)\s*=/m.test(root));
const source=c.read(policy.sourceManifest);for(const f of source.files)if(f.status==='recorded-accepted-source')assert.equal(c.sha(fs.readFileSync(f.path)),f.sha256,'APPLICATION_BEHAVIOR_CHANGED');
const run=phase=>c.cp.spawnSync(process.execPath,['scripts/dcs-production.cjs',phase],{cwd:c.root,encoding:'utf8',windowsHide:true});
for(const phase of ['stage','worker','pages','rollback']){const r=run(phase);assert.notEqual(r.status,0);assert((r.stdout+r.stderr).includes('SEPARATE_RELEASE_APPROVAL_REQUIRED'));}
assert(!fs.existsSync(policy.output+'/worker-staged.json'));assert(!fs.existsSync(policy.output+'/worker-activated.json'));assert(!fs.existsSync(policy.output+'/pages-activated.json'));
console.log(JSON.stringify({passed:true,retiredProfiles:10,archiveIntegrity:true,unchangedApplicationSource:true,unchangedDormantArtworkDependency:true,oldImportInstructionUnavailable:true,rootDefaultCannotTargetProduction:true,allRemoteWritePhasesRefusedWithoutSeparateApproval:true}));
