// Focused real-browser acceptance against the credential-free local Astro app.
// Existing Puppeteer and installed Chrome only; no hosted requests or form submissions.
import puppeteer from 'puppeteer';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const base=new URL(process.argv[2]??'http://127.0.0.1:4339');
if(base.hostname!=='127.0.0.1'||base.protocol!=='http:')throw Error('LOOPBACK_ONLY');
const output=path.resolve('.build-temp/dcs-public-browser-20261117');await mkdir(output,{recursive:true});
const results=[],errors=[],responses=[],blocked=[],links=new Set();
const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const check=(row,name,pass,details)=>row.checks.push({name,pass:Boolean(pass),...(details===undefined?{}:{details})});
const contrastAudit=()=>{
   const rgb=s=>(s.match(/[\d.]+/g)??[]).map(Number);const lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
   const failures=[];let checked=0;
   for(const e of document.querySelectorAll('main h1,main h2,main h3,main p,main li,main a,main label,main legend,main dt,main dd,main summary,main button')){
    if(!e.checkVisibility()||!e.textContent.trim())continue;const style=getComputedStyle(e),fg=rgb(style.color);let layers=[],a=e;while(a){const c=rgb(getComputedStyle(a).backgroundColor);if(c.length>=3)layers.unshift(c);a=a.parentElement;}let bg=[255,255,255];for(const c of layers){const alpha=c[3]??1;bg=bg.map((x,i)=>c[i]*alpha+x*(1-alpha));}const x=lum(fg),y=lum(bg),ratio=(Math.max(x,y)+.05)/(Math.min(x,y)+.05),size=parseFloat(style.fontSize),bold=parseInt(style.fontWeight)>=700,required=size>=24||(bold&&size>=18.66)?3:4.5;checked++;if(ratio+.01<required)failures.push({tag:e.tagName,text:e.textContent.trim().slice(0,70),ratio:Number(ratio.toFixed(2)),required});
   }return {checked,failures};
  };
try{
 const page=await browser.newPage();
 await page.setRequestInterception(true);
 page.on('request',request=>{const u=new URL(request.url());if(['data:','blob:'].includes(u.protocol)||((u.origin===base.origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))&&request.method()==='GET'))return request.continue();blocked.push({host:u.hostname,method:request.method()});return request.abort();});
 page.on('pageerror',error=>errors.push({kind:'pageerror',message:error.message}));
 page.on('console',message=>{if(message.type()==='error')errors.push({kind:'console',message:message.text()});});
 page.on('response',response=>{if(response.status()>=400)responses.push({url:response.url(),status:response.status()});});
 for(const width of [1440,768,390])for(const [name,route] of [['landing','/deck-creator-studio/'],['pricing','/deck-creator-studio/pricing/'],['faq','/deck-creator-studio/faq/']]){
  const row={page:name,width,checks:[]};results.push(row);await page.setViewport({width,height:1000});
  const response=await page.goto(new URL(route,base).href,{waitUntil:'networkidle2',timeout:60000});await page.evaluate(()=>document.fonts.ready);
  check(row,'HTTP 200',response.status()===200);check(row,'No horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check(row,'One main landmark',await page.$$eval('main',nodes=>nodes.length===1));
  const metrics=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
   return {heading:getComputedStyle(document.querySelector('.dcs-public h1')).fontFamily,body:getComputedStyle(document.querySelector('.dcs-public')).fontFamily,paper:getComputedStyle(document.querySelector('.dcs-public')).backgroundColor,fonts:{heading:document.fonts.check('24px "Playfair Display"'),body:document.fonts.check('16px Inter'),accent:!document.querySelector('.dcs-example-page')||document.fonts.check('20px "Cormorant Garamond"')},images:[...document.images].filter(i=>i.checkVisibility()).map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),cards:[...document.querySelectorAll('.dcs-pathway-card')].map(e=>({tier:e.dataset.pathway,card:rect(e),heading:rect(e.querySelector('h3')),price:rect(e.querySelector('.dcs-price')),button:rect(e.querySelector('.dcs-public-button'))})),hero:document.querySelector('.dcs-public-hero')?[...document.querySelector('.dcs-public-hero').children].map(rect):null};
  });row.metrics=metrics;
  check(row,'Editorial typography and paper surface',metrics.heading.includes('Playfair Display')&&metrics.body.includes('Inter')&&metrics.paper==='rgb(242, 239, 233)');
  check(row,'Web fonts loaded',Object.values(metrics.fonts).every(Boolean),metrics.fonts);check(row,'Visible images loaded',metrics.images.every(i=>i.loaded));
  const join=await page.$eval('main a[href*="mode=join"]',e=>e.href);const joinUrl=new URL(join);check(row,'Explore join mode and Studio return',joinUrl.origin===base.origin&&joinUrl.pathname==='/auth/register/'&&joinUrl.searchParams.get('mode')==='join'&&joinUrl.searchParams.get('redirectTo')==='/studio/account/');
  if(name!=='faq'){
   check(row,'Four sister cards',metrics.cards.map(c=>c.tier).join('|')==='explore|create|collaborate|develop');
   const groupSize=width===1440?4:width===768?2:1;const groups=Array.from({length:4/groupSize},(_,i)=>metrics.cards.slice(i*groupSize,(i+1)*groupSize));
   check(row,'Responsive card rows and equal heights',groups.every(g=>Math.max(...g.map(x=>x.card.y))-Math.min(...g.map(x=>x.card.y))<2&&Math.max(...g.map(x=>x.card.height))-Math.min(...g.map(x=>x.card.height))<2));
   check(row,'Price alignment within card rows',groups.every(g=>Math.max(...g.map(x=>x.price.y))-Math.min(...g.map(x=>x.price.y))<3),groups.map(g=>g.map(x=>Math.round(x.price.y))));
   check(row,'CTA alignment within card rows',groups.every(g=>Math.max(...g.map(x=>x.button.y))-Math.min(...g.map(x=>x.button.y))<3),groups.map(g=>g.map(x=>Math.round(x.button.y))));
   for(const [tier,value,amount,cadence] of [['create','annual','$120','Per year'],['create','monthly','$12','Per month'],['collaborate','instalments','$620','2 monthly payments'],['collaborate','once','$590','One payment'],['develop','instalments','$1,575','3 monthly payments'],['develop','once','$1,490','One payment']]){
    await page.click(`[data-pathway="${tier}"] input[value="${value}"]`);const state=await page.$eval(`[data-pathway="${tier}"]`,card=>({amount:card.querySelector('[data-pathway-amount]').textContent,cadence:card.querySelector('[data-pathway-cadence]').textContent,choice:new FormData(card.querySelector('form')).get('billing')}));check(row,`${tier} ${value} summary`,state.amount===amount&&state.cadence.includes(cadence)&&state.choice===value,state);
   }
   const real=await page.$eval('#realise',e=>({text:e.textContent,forms:e.querySelectorAll('form').length,href:e.querySelector('a').getAttribute('href')}));check(row,'Realise inquiry-only',!real.text.includes('$')&&!/\b(?:six|6).month|\b(?:one|1).hour/i.test(real.text)&&real.forms===0&&real.href.startsWith('/contact/'));
  }
  if(name==='landing'){
   check(row,'Hero responsive composition',width>720?metrics.hero[0].x<metrics.hero[1].x&&Math.abs(metrics.hero[0].y-metrics.hero[1].y)<130:metrics.hero[1].y>metrics.hero[0].y);
   check(row,'Meet Leilia approved copy',await page.$eval('main',e=>e.textContent.includes('Meet Leilia')&&e.textContent.includes('more than 40 years')));
   await page.focus('#founding-collaboration>summary');await page.keyboard.press('Enter');
   check(row,'Historical arrangement opens by keyboard',await page.$eval('#founding-collaboration',e=>e.open&&e.textContent.includes('US$495')&&e.textContent.includes('US$595 total')));
   check(row,'No overflow with historical content open',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.$eval('.creator-invitation__portrait img',e=>e.scrollIntoView());await page.waitForFunction(()=>{const i=document.querySelector('.creator-invitation__portrait img');return i.complete&&i.naturalWidth>0;});check(row,'Historical portrait loads',true);
   const historic=await page.$eval('.creator-invitation__hero',e=>({background:getComputedStyle(e).backgroundColor,heading:getComputedStyle(e.querySelector('h2')).color,link:getComputedStyle(e.querySelector('a')).color}));check(row,'Historical heading and links use readable editorial surface',historic.background==='rgb(232, 227, 219)'&&historic.heading==='rgb(26, 26, 26)'&&historic.link==='rgb(6, 94, 115)',historic);const expandedContrast=await page.evaluate(contrastAudit);check(row,'Expanded historical text contrast',expandedContrast.failures.length===0,expandedContrast);
   await page.screenshot({path:path.join(output,`historical-${width}.png`),fullPage:true});await page.focus('#founding-collaboration>summary');await page.keyboard.press('Enter');check(row,'Historical disclosure closes by keyboard',await page.$eval('#founding-collaboration',e=>!e.open));
  }
  if(name==='faq'){
   const anchors=await page.$$eval('nav[aria-label="FAQ categories"] a',nodes=>nodes.map(a=>({href:a.getAttribute('href'),exists:!!document.getElementById(a.hash.slice(1))})));check(row,'All FAQ category/question anchors exist',anchors.every(a=>a.exists)&&anchors.length>10,anchors.length);
   await page.click('nav[aria-label="FAQ categories"] a[href="#support"]');check(row,'FAQ category navigation',await page.evaluate(()=>location.hash==='#support'));
   await page.focus('nav[aria-label="FAQ categories"] details>summary');await page.keyboard.press('Enter');check(row,'Question index opens by keyboard',await page.$eval('nav[aria-label="FAQ categories"] details',e=>e.open));
   const target=await page.$eval('nav[aria-label="FAQ categories"] details a',e=>e.getAttribute('href'));await page.click(`nav[aria-label="FAQ categories"] details a[href="${target}"]`);check(row,'Specific question navigation',await page.evaluate(hash=>location.hash===hash,target));
  }
  const contrast=await page.evaluate(contrastAudit);check(row,'Rendered text contrast',contrast.failures.length===0,contrast);
  await page.focus('main a');await page.keyboard.press('Tab');const focus=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {tag:e.tagName,text:e.textContent.trim().slice(0,65),visible:e.getClientRects().length>0,outline:s.outlineStyle,width:parseFloat(s.outlineWidth),color:s.outlineColor};});check(row,'Keyboard Tab and visible focus',focus.visible&&focus.outline!=='none'&&focus.width>=2,focus);
  if(width<901){await page.focus('.site-nav-toggle');await page.keyboard.press('Enter');const opened=await page.$eval('.site-nav-toggle',e=>e.getAttribute('aria-expanded')==='true');const navVisible=await page.$eval('#site-primary-nav',e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden');await page.keyboard.press('Escape');const closed=await page.$eval('.site-nav-toggle',e=>e.getAttribute('aria-expanded')==='false');check(row,'Responsive menu keyboard open and Escape close',opened&&navVisible&&closed);}
  for(const href of await page.$$eval('main a[href]',nodes=>nodes.map(a=>a.href))){const u=new URL(href);if(u.origin===base.origin)links.add(u.pathname+u.search);}
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,`${name}-${width}.png`),fullPage:true});
  console.log(JSON.stringify({page:name,width,failed:row.checks.filter(c=>!c.pass)}));
 }
 const linkChecks=[];for(const href of links){const response=await page.goto(new URL(href,base).href,{waitUntil:'domcontentloaded',timeout:60000});linkChecks.push({href,status:response.status(),finalPath:new URL(page.url()).pathname,pass:response.status()<400});}
 const pass=results.every(r=>r.checks.every(c=>c.pass))&&linkChecks.every(l=>l.pass)&&errors.length===0&&responses.length===0&&blocked.length===0;
 await writeFile(path.join(output,'BROWSER-RESULTS.json'),JSON.stringify({localOnly:true,base:base.href,results,linkChecks,errors,responses,blocked,pass},null,2));if(!pass)process.exitCode=1;
 console.log(JSON.stringify({views:results.length,checks:results.flatMap(r=>r.checks).length,failed:results.flatMap(r=>r.checks.filter(c=>!c.pass)).length,links:linkChecks.filter(l=>!l.pass),errors,responses,blocked}));
}finally{await browser.close();}
