import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parseCookieHeader } from '@supabase/ssr';
const load = (file, imports) => {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8').replaceAll('import.meta.env', '({})');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    assert.ok(name in imports, `Unexpected import ${name}`); return imports[name];
  }, Response, Headers }, { filename: file });
  return module.exports;
};
const env = load('../src/lib/community/env.ts', {});
const locals = { serverRuntime: { env: { PUBLIC_SUPABASE_URL: 'https://synthetic.invalid', PUBLIC_SUPABASE_ANON_KEY: 'synthetic-public-key' } } };
assert.equal(env.hasSupabaseConfig(locals), true);
assert.equal(env.hasSupabaseConfig({ runtime: locals.serverRuntime }), false);
assert.equal(env.hasSupabaseConfig({ request: { env: locals.serverRuntime.env } }), false);
let options;
const auth = load('../src/lib/community/supabaseServer.ts', {
  '@supabase/supabase-js': { createClient() { throw Error('Service client must not be constructed by these checks'); } },
  '@supabase/ssr': { parseCookieHeader: raw => [...parseCookieHeader(raw), { name: 'invalid', value: undefined }], createServerClient(url, key, value) { assert.equal(url, 'https://synthetic.invalid'); options = value; return {}; } },
  './env': env,
});
const saved = [];
const cookies = { set: (...args) => saved.push(args), headers: () => ['session=synthetic; HttpOnly'] };
const responseHeaders = new Headers();
auth.createCommunityServerClient(new Request('https://synthetic.invalid', { headers: { Cookie: 'token=abc%20def; empty=' } }), cookies, locals, responseHeaders);
assert.deepEqual(JSON.parse(JSON.stringify(options.cookies.getAll())), [{ name: 'token', value: 'abc def' }, { name: 'empty', value: '' }]);
options.cookies.setAll([{ name: 'session', value: 'renewed', options: { httpOnly: true, secure: true, sameSite: 'lax' } }], { 'cache-control': 'private, no-store' });
assert.equal(saved[0][2].httpOnly, true);
assert.equal(saved[0][2].secure, true);
assert.equal(saved[0][2].path, '/');
assert.equal(responseHeaders.get('cache-control'), 'private, no-store');
const redirect = auth.authRedirect('/community/', cookies);
assert.equal(redirect.status, 303);
assert.ok(redirect.headers.get('cache-control').includes('no-store'));
assert.ok(redirect.headers.get('set-cookie').includes('HttpOnly'));
console.log('Server binding and cookie boundaries: passed (synthetic, no network).');
