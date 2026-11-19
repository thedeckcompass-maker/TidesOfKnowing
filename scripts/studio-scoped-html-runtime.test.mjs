import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { Miniflare } from 'miniflare';
import ts from 'typescript';

// Actual local workerd HTMLRewriter. Only the app/origin bodies are synthetic.
// No real Supabase/binding client and all external worker egress is explicitly denied.
let mf;
const modules = { 'dcs-scoped.mjs': { type: 'esm', contents: fs.readFileSync('src/worker-adapters/dcs-scoped.mjs', 'utf8') } };
function include(relative) {
  if (modules[relative]) return;
  const text = fs.readFileSync(path.join('dist/server', relative), 'utf8');
  modules[relative] = { type: 'esm', contents: text };
  const ast = ts.createSourceFile(relative, text, 99, true, ts.ScriptKind.JS);
  for (const node of ast.statements) if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('.')) include(path.posix.join(path.posix.dirname(relative), node.moduleSpecifier.text));
}
include('chunks/authCallback_Cy_QL8nC.mjs');
modules['index.mjs'] = { type: 'esm', contents: `
import {withScopedDcs} from './dcs-scoped.mjs';
import {a as safeRedirect} from './chunks/authCallback_Cy_QL8nC.mjs';
const manifest={assets:{'/_astro/test.js':{},'/_astro/test.css':{},'/images/synthetic.jpg':{}}};
const html='<link rel="stylesheet" href="/_astro/test.css"><link rel="canonical" href="https://www.tidesofknowing.com/studio/"><script type="module" src="/_astro/test.js"></script><script type="module">import "/_astro/test.js";</script><script type="application/json">{"unchanged":"/_astro/test.js"}</script><img src="/images/synthetic.jpg" srcset="/images/synthetic.jpg 1x, /images/synthetic.jpg 2x"><form method="post" action="/auth/logout/"></form><a href="/auth/login/">Sign in</a>';
const app={async fetch(r){if(r.method==='POST')return new Response(await r.text(),{headers:{'content-type':'application/json'}});const h=new Headers({'content-type':'text/html','cache-control':'private, no-store','etag':'old','content-digest':'old'});h.append('set-cookie','a=fixture; Path=/; Secure');h.append('set-cookie','b=fixture; Path=/; Secure');const chunks=[html.slice(0,211),html.slice(211,220),html.slice(220)];return new Response(new ReadableStream({start(c){for(const s of chunks)c.enqueue(new TextEncoder().encode(s));c.close()}}),{headers:h});}};
const origin=async r=>new Response(r.method==='POST'?await r.text():html,{headers:{'content-type':'text/html','cache-control':'public,max-age=60','x-source':'pages'}});
const adapter=withScopedDcs(app,origin,manifest,safeRedirect);
export default {fetch(r,e,c){return adapter.fetch(r,{ASSETS:{fetch:q=>new Response(new URL(q.url).pathname,{headers:{'content-type':'text/plain'}})}},c)}};
` };
before(async () => {
  mf = new Miniflare({ cf: false, enableDevRegistry: false, telemetry: { enabled: false }, workers: [{
    config: { name: 'dcs-scoped-local', compatibilityDate: '2026-04-01', compatibilityFlags: ['nodejs_compat'], manifest: { mainModule: 'index.mjs', modules } },
    dev: { rootPath: process.cwd(), outboundService: { type: 'fetcher', handler: async () => { throw Error('External network disabled'); } } }
  }] });
  await mf.ready;
});
after(async () => { if (mf) await mf.dispose(); });

test('native HTMLRewriter rebases attributes and split inline imports, marks auth, preserves JSON/canonical/cookies', async () => {
  const r = await mf.dispatchFetch('https://www.tidesofknowing.com/studio/projects/synthetic/');
  assert.equal(r.status, 200); const text = await r.text();
  assert(text.includes('href="/_dcs-assets/_astro/test.css"'));
  assert(text.includes('src="/_dcs-assets/_astro/test.js"'));
  assert(text.includes('import "/_dcs-assets/_astro/test.js";'));
  assert(text.includes('srcset="/_dcs-assets/images/synthetic.jpg 1x, /_dcs-assets/images/synthetic.jpg 2x"'));
  assert(text.includes('{"unchanged":"/_astro/test.js"}'));
  assert(text.includes('href="https://www.tidesofknowing.com/studio/"'));
  assert(text.includes('action="/auth/logout/?redirectTo=%2Fstudio%2Fprojects%2Fsynthetic%2F"'));
  assert(text.includes('href="/auth/login/?redirectTo=%2Fstudio%2Fprojects%2Fsynthetic%2F"'));
  assert.equal(r.headers.get('etag'), null); assert.equal(r.headers.get('content-digest'), null);
  assert.equal(r.headers.getSetCookie().length, 2);
});

test('native runtime leaves public Pages HTML, headers and original assets unchanged', async () => {
  const r = await mf.dispatchFetch('https://www.tidesofknowing.com/'); const text = await r.text();
  assert.equal(r.headers.get('x-source'), 'pages'); assert.equal(r.headers.get('cache-control'), 'public,max-age=60');
  assert(text.includes('action="/auth/logout/"')); assert(text.includes('src="/_astro/test.js"'));
  assert(!text.includes('/_dcs-assets/'));
});

test('native DCS asset request maps to original binding path while ordinary asset stays Pages', async () => {
  assert.equal(await (await mf.dispatchFetch('https://www.tidesofknowing.com/_dcs-assets/_astro/test.js')).text(), '/_astro/test.js');
  assert.equal((await mf.dispatchFetch('https://www.tidesofknowing.com/_astro/test.js')).headers.get('x-source'), 'pages');
});

test('native multipart resend classifier preserves original private form body', async () => {
  const form = new FormData(); form.set('redirectTo', '/studio/'); form.set('email', 'synthetic@example.invalid');
  // Miniflare uses a different Undici FormData realm. Send actual multipart wire
  // bytes, rather than asking that client to recognise Node's global FormData.
  const wire = new Request('https://www.tidesofknowing.com/auth/register/', { method: 'POST', body: form });
  const r = await mf.dispatchFetch(wire.url, { method: 'POST', headers: { 'content-type': wire.headers.get('content-type') }, body: new Uint8Array(await wire.arrayBuffer()) });
  assert.equal(r.headers.get('content-type'), 'application/json');
  assert((await r.text()).includes('synthetic@example.invalid'));
});
