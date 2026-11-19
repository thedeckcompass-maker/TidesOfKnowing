import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {parse} from '@astrojs/compiler-rs';
const bundled=await build({entryPoints:['src/lib/studio/sessionTimeDraft.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {sessionTimeDraft}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].contents).toString('base64'));
test('preferred time preserves the chosen zone and never claims a booking',()=>{
 assert.match(sessionTimeDraft('2026-11-20T14:30',' Europe/London '),/14:30 \(Europe\/London\).*not been sent or booked/);
 for(const wall of ['','2026-02-30T10:00','2026-11-20T25:00'])assert.throws(()=>sessionTimeDraft(wall,'Europe/London'));
 assert.throws(()=>sessionTimeDraft('2026-11-20T14:30','Invalid/Zone'));
 assert.throws(()=>sessionTimeDraft('2026-11-20T14:30',''));
});
test('session draft integrates without a submission or persistence pathway',async()=>{
 const component=await readFile('src/components/studio/SessionTimeDraft.astro','utf8');
 assert.deepEqual(parse(component).diagnostics,[]);
 assert.doesNotMatch(component,/<form\b|fetch\(|localStorage|sessionStorage/);
 assert.match(component,/wall.addEventListener\('input',invalidate\)/);
 assert.match(component,/data-session-clear/);
});
