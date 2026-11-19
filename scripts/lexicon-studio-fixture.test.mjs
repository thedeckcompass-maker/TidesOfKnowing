import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {mapLexiconFixture} from './lib/lexicon-studio-fixture.mjs';
const fixture = JSON.parse(await readFile(new URL('./fixtures/lexicon-demo-20261114.json', import.meta.url), 'utf8'));
const options = {deckType:'hybrid', pathway:'personal'}; // Synthetic choice, not a claim about source provenance.

test('fixture maps deterministically without a database or real entitlement', () => {
  const plan = mapLexiconFixture(fixture, options);
  assert.deepEqual(plan, mapLexiconFixture(fixture, options));
  assert.equal(plan.mode, 'LOCAL_FIXTURE_ONLY');
  assert.match(plan.requiredEntitlement, /Develop-equivalent/);
  assert.equal(plan.cards.length, 22);
  assert.equal(plan.families.length, 3);
  assert.equal(plan.sections.length, fixture.seed.sections.length);
  assert.equal(plan.journals.length, fixture.seed.journal.length);
  assert.deepEqual(plan.preservedUnmapped.worksheets, fixture.seed.worksheets);
  assert.throws(() => mapLexiconFixture(fixture), /Choose a Studio deck type/);
  const bad = structuredClone(fixture); bad.seed.cards[0].family=99;
  assert.throws(() => mapLexiconFixture(bad, options), /Invalid card or family/);
});

test('real Studio Workbook and manuscript projections consume mapped cards, sections and visual direction', async () => {
  const result = await build({entryPoints:['src/lib/studio/projectBookView.ts'],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
  const {projectBookView} = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64'));
  const plan = mapLexiconFixture(fixture, options);
  const view = projectBookView(plan.project, plan.cards, plan.sections, null, plan.families, []);
  assert.equal(view.chapters.find(c=>c.id==='expression').blocks.length, 22);
  assert.ok(view.chapters.find(c=>c.id==='companion').blocks.some(b=>b.text===fixture.seed.sections[0].body));
  assert.ok(view.chapters.find(c=>c.id==='visual-world').blocks.some(b=>b.text===fixture.seed.pillar_work['visual-world'].fields.vision));
  assert.equal(view.sources.cards.length, 22);
  const documentsBundle = await build({entryPoints:['src/lib/studio/projectBookDocuments.ts'],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
  const {projectBookDocuments} = await import('data:text/javascript;base64,' + Buffer.from(documentsBundle.outputFiles[0].contents).toString('base64'));
  const manuscript = projectBookDocuments(view).manuscript[0].blocks;
  assert.equal(manuscript.filter(block => block.cardId).length, 22);
  assert.ok(manuscript.some(block => block.text === fixture.seed.sections[0].body));
});
