import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from '@astrojs/compiler-rs';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import { faqSections, walkthroughSteps } from '../src/data/studio/creator-guidance.mjs';

test('creator FAQ has visible, non-conflicting Explore guidance', () => {
  const questions = faqSections.flatMap(section => section.questions);
  assert.equal(new Set(faqSections.map(section => section.id)).size, faqSections.length);
  assert.ok(questions.length >= 12);
  assert.match(questions.flat().join(' '), /one active project/i);
  assert.match(questions.flat().join(' '), /ten active cards/i);
  assert.doesNotMatch(questions.flat().join(' '), /\$590|\$1490|\$1,490/);
});

test('pricing explains Explore capacity without changing paid offers', async () => {
  const pricing = await readFile(new URL('../src/pages/deck-creator-studio/pricing.astro', import.meta.url), 'utf8');
  const capacity = await readFile(new URL('../src/components/studio/ExploreCapacity.astro', import.meta.url), 'utf8');
  assert.deepEqual(parse(capacity).diagnostics, []);
  assert.match(pricing, /presentation.landing.pricingHtml/);
  assert.match(capacity, /one active project/i);
  assert.match(capacity, /ten active cards/i);
  assert.match(capacity, /Deleting a card makes room/i);
});

test('walkthrough uses existing Studio task and entry routes', async () => {
  const navigation = await readFile(new URL('../src/lib/studio/navigation.ts', import.meta.url), 'utf8');
  const keys = [...navigation.matchAll(/(?:^|[,\s])([a-z]+):\[/g)].map(match => match[1]);
  for (const step of walkthroughSteps) {
    const url = new URL(step.href, 'https://example.invalid');
    assert.ok(url.pathname.startsWith('/studio/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/deck-creator-studio/'));
    const task = url.searchParams.get('task');
    if (task) assert.ok(keys.includes(task), `Unknown project task: ${task}`);
  }
});

test('new pages and their linked entry points parse as Astro', async () => {
  for (const path of ['../src/pages/deck-creator-studio/faq.astro', '../src/pages/deck-creator-studio/walkthrough.astro', '../src/pages/deck-creator-studio/pricing.astro', '../src/pages/deck-creator-studio.astro']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.deepEqual(parse(source).diagnostics, [], path);
  }
});

test('Lexicon fixture preserves 22 distinct filesystem seed cards', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/lexicon-demo-20261114.json', import.meta.url), 'utf8'));
  assert.equal(fixture.seed.cards.length, 22);
  assert.equal(new Set(fixture.seed.cards.map(card => card.id)).size, 22);
  assert.match(fixture.provenance.sourceKind, /browser-only edits are not included/);
  assert.match(fixture.provenance.use, /not approved for public publication or production import/);
});

test('integrated FAQ retains source-backed production guidance and a linked question index',async()=>{
 const text=faqSections.flatMap(s=>s.questions).flat().join(' ');
 assert.match(text,/publishing or design experience/);assert.match(text,/external suppliers/);assert.match(text,/not certified print-ready/);
 const page=await readFile(new URL('../src/pages/deck-creator-studio/faq.astro',import.meta.url),'utf8');
 const prepared=JSON.parse(await readFile(new URL('../src/data/studio/approved-public/presentation.json',import.meta.url),'utf8'));assert.match(prepared.faq.html,/Find a specific question/);assert.equal(prepared.faq.questions.length,21);
 assert.match(page,/faqPageJsonLd\(presentation.faq.questions/);assert.deepEqual(parse(page).diagnostics,[]);
});

test('broader Tides FAQ uses current reading data and matching visible/structured questions',async()=>{
 const output=await build({stdin:{contents:"export {tidesFaqSections} from './src/data/tides-faq.ts';export {ASK_LEILIA_READINGS} from './src/data/askLeilia.ts';export {faqPageJsonLd} from './src/lib/faqPageJsonLd.ts';",resolveDir:process.cwd()},bundle:true,write:false,format:'cjs',platform:'node'});
 const m={exports:{}};new Function('module','exports','require',output.outputFiles[0].text)(m,m.exports,createRequire(import.meta.url));const {tidesFaqSections,ASK_LEILIA_READINGS,faqPageJsonLd}=m.exports;
 const questions=tidesFaqSections.flatMap(s=>s.questions);assert.equal(questions.length,8);assert.equal(new Set(questions.map(q=>q[0])).size,8);
 for(const r of ASK_LEILIA_READINGS){assert.ok(questions[2][1].includes(r.name));assert.ok(questions[2][1].includes(r.price));}
 assert.equal(faqPageJsonLd(questions.map(([question,answerHtml])=>({question,answerHtml})),'https://example.invalid/faq/').mainEntity.length,8);
 const page=await readFile(new URL('../src/pages/faq.astro',import.meta.url),'utf8');assert.deepEqual(parse(page).diagnostics,[]);assert.match(page,/href="\/deck-creator-studio\/faq\/"/);assert.match(page,/id=\{id\(s.id,index\)\}/);assert.match(page,/href=\{'#'\+id\(s.id,index\)\}/);
 assert.doesNotMatch(questions.flat().join(' '),/payment confirmed|staff see work only|trains AI|guaranteed/);
});
