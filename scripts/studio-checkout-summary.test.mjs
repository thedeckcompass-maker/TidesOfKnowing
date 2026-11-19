import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from '@astrojs/compiler-rs';
test('checkout summary uses the existing selected offer and preserves payment gating',async()=>{
 const page=await readFile('src/pages/deck-creator-studio/checkout.astro','utf8');
 const summary=await readFile('src/components/studio/CheckoutSummary.astro','utf8');
 assert.deepEqual(parse(page).diagnostics,[]);assert.deepEqual(parse(summary).diagnostics,[]);
 assert.match(page,/<CheckoutSummary choice=\{choice\}\/>/);
 assert.match(summary,/\{choice.terms\}/);assert.match(summary,/\{choice.name\}/);
 assert.match(page,/disabled=\{!enabled\}/);assert.match(page,/billingConfigurationEnabled/);
 assert.doesNotMatch(summary,/\$590|\$1490|\$1,490|<form/);
});
