import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import {experimental_AstroContainer as Container} from 'astro/container';
const require=createRequire(import.meta.url),{parseHTML}=require(path.resolve('.build-temp/dcs-community-admin-layout-20261118/dom-tooling/node_modules/linkedom'));
const dir=path.resolve(process.argv[2]||'.build-temp/dcs-sales-pathways-20261119'),server=dir+'/build/dist/server',original=globalThis.fetch;let external=0;globalThis.fetch=async()=>{external++;throw Error('External requests forbidden');};
try{
 const line=fs.readFileSync(server+'/entry.mjs','utf8').split('\n').find(s=>s.startsWith('var _manifest = deserializeManifest(')),manifest=JSON.parse(line.slice(line.indexOf('(')+1,line.lastIndexOf(');'))),container=await Container.create({manifest:{inlinedScripts:new Map(manifest.inlinedScripts)},resolve:id=>'/'+manifest.entryModules[id]});
 const chunks=fs.readdirSync(server+'/chunks').filter(n=>n.endsWith('.mjs')).map(n=>({n,text:fs.readFileSync(server+'/chunks/'+n,'utf8')})),results=[];
 for(const [route,url]of [['deck-creator-studio','/deck-creator-studio/'],['deck-creator-studio/pricing','/deck-creator-studio/pricing/'],['deck-creator-studio/faq','/deck-creator-studio/faq/']]){
  const chunk=chunks.find(x=>x.text.includes('/src/pages/'+route+'.astro')&&x.text.includes('var page ='));assert(chunk,route);
  const component=(await(await import(pathToFileURL(server+'/chunks/'+chunk.n))).page()).default;
  for(const authenticated of [false,true]){
   const response=await container.renderToResponse(component,{request:new Request('https://www.tidesofknowing.com'+url),locals:{user:authenticated?{id:'synthetic-local-only'}:undefined}});assert.equal(response.status,200);const html=await response.text(),{document:d}=parseHTML(html);
   assert.equal(d.querySelector('link[rel="canonical"]').href,'https://www.tidesofknowing.com'+url);assert(!html.includes('@@JOIN@@'));
   if(route.endsWith('/faq')){assert(!/written assessment/i.test(html));assert(html.includes('written review'));}
   else{
    assert.equal(d.querySelectorAll('.plan-card').length,4);assert.equal(d.querySelector('#develop .plan-benefits').textContent,'✓3 more private consultations (4 in total)✓1 more written review (2 in total)');
    assert.equal(d.querySelector('#pathways').nextElementSibling.id,'comparison');assert.equal(d.querySelector('#comparison').nextElementSibling.querySelector('#realise')?.id,'realise');
    for(const a of d.querySelectorAll('.plan-details-trigger'))assert(d.getElementById(a.getAttribute('href').slice(1)));
    assert.equal(d.querySelector('#explore .plan-cta').getAttribute('href'),authenticated?'/studio/account/':'/auth/register/?mode=join&redirectTo=%2Fstudio%2Faccount%2F');
   }
   fs.writeFileSync(dir+'/'+route.replaceAll('/','-')+(authenticated?'-member':'-anonymous')+'.html',html);results.push({route:url,authenticated,status:response.status});
  }
 }
 assert.equal(external,0);fs.writeFileSync(dir+'/candidate-tests.json',JSON.stringify({passed:true,results,externalRequests:0,productionWrites:0,browserAutomation:false,realDeviceVisualCheck:false},null,2));console.log(JSON.stringify({passed:true,renders:results.length,externalRequests:external}));
}finally{globalThis.fetch=original;}
