import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {walkthroughSteps} from '../src/data/studio/creator-guidance.mjs';
const bundle=await build({entryPoints:['src/lib/studio/navigation.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const navigation=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
test('walkthrough visual task opens the real Visual World editor after project selection',()=>{
 const step=walkthroughSteps.find(s=>s.label==='Open visual direction');
 const task=new URL(step.href,'https://example.invalid').searchParams.get('task');
 assert.equal(navigation.projectTask(task),'visual');
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 assert.equal(navigation.projectDestination('visual',id),`/studio/projects/${id}/journey/?chapter=visual-world`);
 assert.equal(navigation.projectCreationDestination(id,'visual'),navigation.projectDestination('visual',id));
 assert.equal(navigation.projectDestination('exchange',id),`/studio/projects/${id}/visual-exchange/`);
 assert.ok(navigation.studioMenu(id).flatMap(g=>g.items).some(i=>i.href===navigation.projectDestination('visual',id)));
});
