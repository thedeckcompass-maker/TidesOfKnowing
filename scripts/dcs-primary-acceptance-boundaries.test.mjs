import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

async function load(entry) {
  const code = (await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent', define: { 'import.meta.env': '{}' } })).outputFiles[0].text;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', code)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
}

test('actual callback keeps Studio paths and rejects external or malformed targets', async () => {
  const { safeAuthCallbackRedirect: safe } = await load('src/lib/community/authCallback.ts');
  assert.equal(safe('/studio/projects/11111111-1111-4111-8111-111111111111/'), '/studio/projects/11111111-1111-4111-8111-111111111111/');
  assert.equal(safe('/community/account/'), '/community/account/?workspace=studio');
  for (const input of ['https://evil.invalid', '//evil.invalid', '%252f%252fevil.invalid', '/studio/../auth/', '/studio/%0d%0aLocation:evil', '/studio.evil.invalid/']) assert.equal(safe(input), '/studio/');
});

test('project-create route accepts an active account without a paid Studio grant', async () => {
  const { POST } = await load('src/pages/api/studio/projects.ts');
  const actor = '22222222-2222-4222-8222-222222222222'; let projectOperations = 0;
  const supabase = { from(table) {
    assert.equal(table, 'studio_projects'); projectOperations++;
    const query = { select() { return query; }, eq() { return query; }, insert() { return query; }, async maybeSingle() { return { data: null, error: null }; }, async single() { return {data:{id:'11111111-1111-4111-8111-111111111111'},error:null}; } };
    return query;
  } };
  const form = new FormData();
  for (const [key, value] of Object.entries({ request_id: '11111111-1111-4111-8111-111111111111', name: 'Synthetic project', deck_type: 'oracle', pathway: 'personal' })) form.set(key, value);
  const request = new Request('https://studio.invalid/api/studio/projects', { method: 'POST', headers: { origin: 'https://studio.invalid' }, body: form });
  const result = await POST({ request, locals: { user: { id: actor }, profile: { id: actor, status: 'active', role: 'member' }, supabase } });
  assert.equal(result.status, 303); assert.equal(projectOperations, 2);
});
