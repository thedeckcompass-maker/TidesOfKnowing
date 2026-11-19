'use strict';
// Read-only reconciliation; no prototype execution, provider calls or application writes.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {parseHTML}=require('../.build-temp/dcs-community-admin-layout-20261118/dom-tooling/node_modules/linkedom');
const dir='.build-temp/dcs-pr30-merge-20261119',sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const wrap=s=>parseHTML('<html><body>'+s+'</body></html>').document,norm=s=>s.replace(/\s+/g,' ').trim();
const register=JSON.parse(fs.readFileSync('docs/DCS-PUBLIC-FIDELITY-SOURCES-20261117.json'));
for(const f of register.sources){const local=f.file.replace(/^B:\/DCS-Parallel-Development-20261113/,'.build-temp/parallel-source-reference-20261113');assert.equal(sha(local),f.sha256,'PARALLEL_REFERENCE_DRIFT');}
const assets=JSON.parse(fs.readFileSync('.build-temp/dcs-authorised-closeout-20261119/pages/PACKAGE-MANIFEST.json')).filter(f=>f.path.startsWith('dcs-approved/'));
assert.equal(assets.length,11);for(const f of assets)assert.equal(sha('public/'+f.path),f.sha256,'APPROVED_PUBLIC_ASSET_DRIFT');
const original=wrap(fs.readFileSync('.build-temp/parallel-source-reference-20261113/landing-consistency-polish-20261114T193415Z/client/faq-dcs.html','utf8'));
const p=JSON.parse(fs.readFileSync('src/data/studio/approved-public/presentation.json')),faq=wrap(p.faq.html),landing=wrap(p.landing.html),text=norm(landing.body.textContent);
assert.deepEqual([...faq.querySelectorAll('.question h3')].map(n=>norm(n.textContent)),[...original.querySelectorAll('.question h3')].map(n=>norm(n.textContent)));
assert.equal(p.faq.questions.length,21);assert.deepEqual([...faq.querySelectorAll('h2')].map(n=>norm(n.textContent)),[...original.querySelectorAll('h2')].map(n=>norm(n.textContent)));
for(const phrase of ['You own what you create','Your ideas, card text, guidebook and artwork are yours','Your project stays private','Working with artists and collaborators','Leilia personally confirms each session time','Find the artist for your deck','We make leaving easy','For the deck that deserves its fullest expression.','dedicated human executive assistant','tag @Leilia'])assert(text.includes(phrase),'OWNER_COPY_MISSING '+phrase);
assert(landing.querySelector('#meet-leilia img'));
for(const id of ['feature-pillars','feature-editor','feature-guidebook','feature-sessions','feature-extra-support','feature-community','feature-artist-studio','feature-exports','pathways','compare','realise'])assert(landing.querySelector('#'+id),'APPROVED_SECTION_MISSING '+id);
for(const content of [p.landing.html,p.landing.pricingHtml]){
 const d=wrap(content);assert.equal(norm(d.querySelector('#collaborate .plan-benefits li').textContent),'✓6 group sessions');assert.equal(norm(d.querySelector('#develop .plan-benefits li').textContent),'✓2 more group sessions (8 in total)');assert(d.body.textContent.includes('/ 12 months'));
 assert.equal(d.querySelector('#pathways').nextElementSibling.id,'comparison');assert.equal(d.querySelector('#comparison').nextElementSibling.querySelector('#realise')?.id,'realise');
}
for(const [key,page]of Object.entries(p)){if(key==='checkout')continue;const d=wrap(page.header);for(const nav of d.querySelectorAll('nav')){assert(nav.querySelector('a[href="/blog/"]'));assert([...nav.querySelectorAll('a')].some(n=>norm(n.textContent)==='Account'));assert(![...nav.querySelectorAll('a')].some(n=>['FAQs','Pathways'].includes(norm(n.textContent))));}}
const accepted=JSON.parse(fs.readFileSync('docs/DCS-CLOSEOUT-SOURCE-20261119.json'));let active=0;
for(const f of accepted.files)if(f.status==='recorded-accepted-source'){assert.equal(sha(f.path),f.sha256,'PR_SOURCE_DRIFT '+f.path);active++;}
for(const f of accepted.additionalBuildDependencies)assert.equal(sha(f.path),f.sha256,'DEPENDENCY_DRIFT');for(const f of accepted.rejectedNewFilesAbsent)assert(!fs.existsSync(f));
const lineage=[];for(const name of ['dcs-report-menu-20261119','dcs-sales-desk-20261119','dcs-group-allowances-20261119-v2','dcs-layout-repair-20261119','dcs-authorised-closeout-20261119']){const a=JSON.parse(fs.readFileSync('.build-temp/'+name+'/source-association.json'));for(const f of a.files)assert.equal(sha('.build-temp/'+name+'/build/'+f.path),f.sha256,'RECORDED_SOURCE_PACKAGE_DRIFT');lineage.push({package:name,baseline:a.baseline,changed:a.changed.map(x=>x.path)});}
const late=cp.execFileSync('git',['diff','--name-only','8db6df8','HEAD','--','src'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);assert.deepEqual(late,['src/lib/community/passwordAuth.ts']);
const out={passed:true,parallelOriginalsVerified:register.sources.length,approvedPublicAssetsVerified:assets.length,faqQuestionsPreserved:21,faqCategoriesPreserved:true,ownerCopyPreserved:true,publicSectionsAndBrandAssetsPreserved:true,currentSixEightAndTwelveMonthPricingPreserved:true,laterHeaderNavigationPreserved:true,activeSrcFilesMatchedAcceptedLineage:active,lateSrcChanges:late,rejectedStartBriefAbsent:true,lineage,applicationCorrectionsRequired:[],newVisualAcceptanceClaimed:false};
fs.writeFileSync(dir+'/parallel-authority-reconciliation.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
