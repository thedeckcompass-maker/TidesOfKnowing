import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareLexiconImport} from './lib/lexicon-import-plan.mjs';
const fixture=JSON.parse(await readFile('scripts/fixtures/lexicon-demo-20261114.json','utf8'));
const input={ownerId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',projectId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',deckType:'hybrid',pathway:'personal'};
test('owner-bound review plan is deterministic and preserves relationships',()=>{
 const plan=prepareLexiconImport(fixture,input);
 assert.deepEqual(plan,prepareLexiconImport(fixture,input));
 assert.equal(plan.mode,'REVIEW_ONLY_NO_WRITES');
 assert.equal(plan.cards.length,22);
 assert.ok(plan.cards.every(card=>card.project_id===input.projectId&&plan.families.some(f=>f.id===card.family_id)));
 assert.equal(plan.sections.length,fixture.seed.sections.length);
 assert.equal(plan.journals.length,fixture.seed.journal.length);
 assert.ok(plan.rollback.requires.includes('proof no record'));
 assert.notEqual(plan.cards[0].id,prepareLexiconImport(fixture,{...input,projectId:input.ownerId}).cards[0].id);
 assert.throws(()=>prepareLexiconImport(fixture,{...input,ownerId:'not-a-uuid'}));
});
