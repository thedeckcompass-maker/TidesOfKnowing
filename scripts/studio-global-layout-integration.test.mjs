import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import puppeteer from 'puppeteer';
test('imported global styles apply member header spacing and library selectors without Astro scoping syntax',async()=>{
 const member=await readFile('src/styles/member-workspace.css','utf8'),library=await readFile('src/styles/articles-library-index.css','utf8');
 assert.doesNotMatch(member+library,/:global\(/);
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{const page=await browser.newPage();await page.setRequestInterception(true);page.on('request',r=>r.abort());
 await page.setContent(`<style>.breadcrumbs{margin:20px;max-width:20px}.article-card{min-width:200px}${member}\n${library}</style><body class="tok-body--member-workspace"><main id="main-content"><section class="tok-library--articles"><nav class="breadcrumbs">Breadcrumb</nav><div class="tok-library__grid"><article class="article-card">Synthetic card</article></div></section></main><footer class="site-footer--workspace"><div class="site-footer__discover">${Array.from({length:7},()=>'<a class="site-footer__discover-link">Item</a>').join('')}</div></footer></body>`);
 for(const [width,header] of [[1200,'3.55rem'],[390,'3.35rem']]){await page.setViewport({width,height:850});const result=await page.evaluate(()=>({header:getComputedStyle(document.body).getPropertyValue('--tok-header-height').trim(),padding:getComputedStyle(document.getElementById('main-content')).paddingTop,margin:getComputedStyle(document.querySelector('.breadcrumbs')).marginTop,minWidth:getComputedStyle(document.querySelector('.article-card')).minWidth,hidden:getComputedStyle(document.querySelectorAll('.site-footer__discover-link')[6]).display,visible:getComputedStyle(document.querySelector('.site-footer__discover-link')).display}));assert.equal(result.header,header);assert.equal(result.padding,parseFloat(header)*16+'px');assert.equal(result.margin,'0px');assert.equal(result.minWidth,'0px');assert.equal(result.hidden,'none');assert.notEqual(result.visible,'none');}
 }finally{await browser.close();}
});
