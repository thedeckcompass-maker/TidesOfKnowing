import fs from 'node:fs';
import path from 'node:path';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {pathToFileURL} from 'node:url';

const dir=path.resolve(process.env.DCS_WORKER_CANDIDATE_DIR||'.build-temp/dcs-production-worker-candidate-20261118-v6/server');
const {classifyDcsRequest,historyDispatchRequest}=await import(pathToFileURL(path.join(dir,'dcs-scoped.mjs')).href);
const safe=x=>x;
test('deployed adapter retains Pages fallback, Studio routing and history routing',async()=>{
 assert.equal((await classifyDcsRequest(new Request('https://www.tidesofknowing.com/'),safe)).target,'pages');
 assert.equal((await classifyDcsRequest(new Request('https://www.tidesofknowing.com/studio/'),safe)).target,'app');
 assert.equal((await classifyDcsRequest(new Request('https://www.tidesofknowing.com/api/studio/projects'),safe)).target,'app');
 assert.equal(new URL(historyDispatchRequest(new Request('https://www.tidesofknowing.com/studio/community-history/abc')).url).pathname,'/community/abc');
 assert.equal((await classifyDcsRequest(new Request('https://www.tidesofknowing.com/auth/callback'),safe)).target,'app');
});
test('all thirteen production route families retain their scoped dispatch contract',async()=>{
 const paths=[['/_dcs-assets/_astro/example.css','asset'],['/auth/login/?redirectTo=%2Fstudio%2F','app'],['/community/account/?workspace=studio','app'],['/api/ask-leilia/requests/abc/delivery-pdf','app'],['/api/reading-library/abc/pdf','app'],['/api/studio/projects','app'],['/api/artists/example','app'],['/ask-leilia/admin/studio-access/','app'],['/artists/collaborate/','app'],['/artists/visual-design-exchange/','app'],['/deck-creator-studio/checkout/','app'],['/studio/','app'],['/community/sections/deck-creator-studio/','redirect']];
 for(const [p,target] of paths)assert.equal((await classifyDcsRequest(new Request('https://www.tidesofknowing.com'+p),safe)).target,target,p);
});

const modules={};function collect(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())collect(f);else if(f.endsWith('.mjs'))modules[path.relative(dir,f).replaceAll('\\','/')]={type:'esm',contents:fs.readFileSync(f,'utf8')};}}collect(dir);
let mf,outbound=0;after(async()=>{if(mf)await mf.dispose();assert.equal(outbound,0);});
test('frozen Worker bundle runs behind deployed adapter with no external egress',async()=>{
 mf=new Miniflare({cf:false,enableDevRegistry:false,telemetry:{enabled:false},workers:[{config:{name:'dcs-release-local',compatibilityDate:'2026-04-01',compatibilityFlags:['nodejs_compat'],manifest:{mainModule:'dcs-scoped-entry.mjs',modules}},dev:{rootPath:process.cwd(),outboundService:{type:'fetcher',handler:async()=>{outbound++;throw Error('External egress forbidden');}}}}]});
 await mf.ready;
 const response=await mf.dispatchFetch('https://www.tidesofknowing.com/studio/',{redirect:'manual'});
 assert([302,303].includes(response.status),'unauthenticated Studio must redirect; got '+response.status);
 assert.match(response.headers.get('location')||'',/\/auth\/(login|register)/);
 const history=await mf.dispatchFetch('https://www.tidesofknowing.com/studio/community-history/00000000-0000-0000-0000-000000000001',{redirect:'manual'});
 assert.notEqual(history.status,404,'deployed community-history adapter must resolve to a compiled handler');
});
