'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {parseHTML}=require('../.build-temp/dcs-community-admin-layout-20261118/dom-tooling/node_modules/linkedom');
const dir=path.resolve('.build-temp/dcs-sales-pathways-20261119');fs.mkdirSync(dir,{recursive:true});
const baseline=JSON.parse(fs.readFileSync('.build-temp/dcs-report-menu-20261119/build/src/data/studio/approved-public/presentation.json'));
const p=JSON.parse(fs.readFileSync('src/data/studio/approved-public/presentation.json'));
const doc=html=>parseHTML('<html><body>'+html+'</body></html>').document;
const old=doc(baseline.landing.html),landing=doc(p.landing.html),pricing=doc(p.landing.pricingHtml),checks=[];
for(const [name,d]of [['landing',landing],['pricing',pricing]]){
 const benefits=plan=>[...d.querySelectorAll('#'+plan+' .plan-benefits li')].map(x=>x.lastElementChild.textContent);
 assert.equal(d.querySelector('#pathways-title').textContent,'Four pathways, one creative purpose');
 assert.deepEqual(benefits('collaborate'),['8 group sessions','1 private consultation','1 written review','12 months of Create included']);
 assert.deepEqual(benefits('develop'),['3 more private consultations (4 in total)','1 more written review (2 in total)']);
 assert.equal(d.querySelector('#develop .plan-inheritance').textContent,'Everything in Collaborate, plus:');
 for(const plan of ['explore','create','collaborate','develop']){
  const card=d.querySelector('#'+plan),original=old.querySelector('#'+plan);
  assert.equal(card.querySelector('.plan-description').outerHTML,original.querySelector('.plan-description').outerHTML);
  assert.equal(card.querySelector('.plan-bottom').outerHTML,original.querySelector('.plan-bottom').outerHTML);
  if(['explore','create'].includes(plan))for(const cls of ['price','plan-benefits','plan-inheritance'])assert.equal(card.querySelector('.'+cls)?.outerHTML,original.querySelector('.'+cls)?.outerHTML);
  else assert.equal(card.querySelector('.price-cadence').textContent,'/ 12 months');
  const link=card.querySelector('a.plan-details-trigger');assert(link);assert.equal(link.getAttribute('href'),'#compare-'+plan);assert(d.querySelector(link.getAttribute('href')));assert(!link.hasAttribute('data-plan'));
 }
 assert(d.querySelector('#compare'));assert(d.querySelector('#comparison')); // Existing inbound links remain valid.
 assert.equal(d.querySelector('.feature-matrix tbody').outerHTML.replaceAll('/deck-creator-studio/#feature-','#feature-'),old.querySelector('.feature-matrix tbody').outerHTML);
 assert.deepEqual([...d.querySelectorAll('.matrix-price')].map(x=>x.textContent),['Free','US$12 / month','US$590 / 12 months','US$1,490 / 12 months']);
 const section=d.querySelector('#pathways');assert.equal(section.nextElementSibling.id,'comparison');assert.equal(section.nextElementSibling.nextElementSibling.querySelector('#realise')?.id,'realise');
 assert.equal(d.querySelector('.pathway-renewal-note').previousElementSibling.className,'grid plan-grid');
 assert.equal(d.querySelector('.pathway-renewal-note').textContent,'Pay once, or in fixed instalments. Nothing renews automatically.');
 for(const a of d.querySelectorAll('a[href^="#"]'))assert(d.getElementById(a.getAttribute('href').slice(1)),name+': broken fragment '+a.getAttribute('href'));
 const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 checks.push(name+': correct inheritance, unchanged Explore/Create offers, payment links, full comparison totals and working fragment destinations');
}
for(const cls of ['who-section','meet-leilia','ownership-section','closing-section'])assert.equal(landing.querySelector('.'+cls).outerHTML,old.querySelector('.'+cls).outerHTML);
assert.equal(landing.querySelector('#realise').outerHTML,old.querySelector('#realise').outerHTML);
for(const e of landing.querySelectorAll('.feature-inclusion'))assert.equal(e.firstElementChild.getAttribute('href'),'#pathways');
assert.equal(landing.querySelector('.inside-start .text-link').textContent,'See pathways and pricing');
assert.equal(doc(p.landing.header).querySelectorAll('nav a[href="/deck-creator-studio/#pathways"]').length,2);
for(const key of ['consultation','realise','checkout'])assert.deepEqual(p[key],baseline[key]);
assert.equal(p.landing.dialogs,baseline.landing.dialogs);assert.equal(p.landing.footer,baseline.landing.footer);
assert(!/written assessment/i.test(JSON.stringify(p.faq)));assert(!/written assessment/i.test(p.landing.html));
const offers='src/lib/studio/serviceOffers.ts';assert.equal(fs.readFileSync(offers,'utf8'),fs.readFileSync('.build-temp/dcs-report-menu-20261119/build/'+offers,'utf8'));
checks.push('Existing six-month service contracts, twelve-month Create access, Realise copy, ownership content, checkout and payment handlers preserved');
const css=fs.readFileSync('src/styles/dcs-approved-public.css','utf8');assert(css.includes('overflow-x:auto'));assert(css.includes('minmax(0,1fr)'));assert(css.includes('.feature-matrix th:target'));
fs.writeFileSync(dir+'/source-tests.json',JSON.stringify({passed:true,checks,externalRequests:0,productionWrites:0,realBrowserVisualVerification:false},null,2));console.log(JSON.stringify({passed:true,checks}));
