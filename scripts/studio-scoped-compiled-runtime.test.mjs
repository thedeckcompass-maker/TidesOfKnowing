import fs from 'node:fs';
import path from 'node:path';
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare } from 'miniflare';

// Executes the actual accepted Astro app behind the new adapter. No Supabase URL,
// API key, Hyperdrive, email, billing or production binding is supplied. All egress
// is denied; these cases exercise only public entry and unauthenticated boundaries.
const base = 'C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-SCOPED-PUBLIC-RELEASE-20261109-v2';
const server = path.join(base, 'candidate/server');
const modules = {};
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (file.endsWith('.mjs')) modules[path.relative(server, file).replaceAll('\\', '/')] = { type: 'esm', contents: fs.readFileSync(file, 'utf8') };
  }
}
collect(server);
modules['local-compiled-test.mjs'] = { type: 'esm', contents: `
import app from './entry.mjs';
import assets from './dcs-assets.mjs';
import {a as safeRedirect} from './chunks/authCallback_Cy_QL8nC.mjs';
import {withScopedDcs} from './dcs-scoped.mjs';
export default withScopedDcs(app,()=>new Response('synthetic Pages origin',{status:488}),assets,safeRedirect);
` };
let mf, outbound = 0;
before(async () => {
  mf = new Miniflare({ cf: false, enableDevRegistry: false, telemetry: { enabled: false }, workers: [{
    config: { name: 'dcs-compiled-local', compatibilityDate: '2026-04-01', compatibilityFlags: ['nodejs_compat'], manifest: { mainModule: 'local-compiled-test.mjs', modules } },
    dev: { rootPath: process.cwd(), outboundService: { type: 'fetcher', handler: async () => { outbound++; throw Error('Production/network access forbidden'); } } }
  }] });
  await mf.ready;
});
after(async () => { if (mf) await mf.dispose(); assert.equal(outbound, 0); });

test('accepted compiled Studio entry renders behind adapter with isolated asset references', async () => {
  const r = await mf.dispatchFetch('https://www.tidesofknowing.com/studio/');
  assert.equal(r.status, 200);
  const html = await r.text();
  assert(html.includes('Deck Creator Studio'));
  assert(html.includes('/_dcs-assets/_astro/'));
  assert(!/(?:src|href)="\/_astro\//.test(html));
});

test('accepted compiled DCS login and private-project return keep the approved same-origin auth contract', async () => {
  const login = await mf.dispatchFetch('https://www.tidesofknowing.com/auth/login/?redirectTo=%2Fstudio%2Fcreators-desk%2F', { redirect: 'manual' });
  assert.equal(login.status, 303);
  assert(login.headers.get('location').includes('/auth/register/?mode=sign-in&redirectTo=%2Fstudio%2Fcreators-desk%2F'));
  const project = await mf.dispatchFetch('https://www.tidesofknowing.com/studio/projects/11111111-1111-4111-8111-111111111111/', { redirect: 'manual' });
  // This existing Astro page uses the framework's default 302; the adapter must
  // preserve it while middleware supplies the Studio return target.
  assert.equal(project.status, 302);
  assert(project.headers.get('location').startsWith('/auth/login/?redirectTo='));
});

test('accepted compiled logout returns to Studio while public website remains the untouched origin', async () => {
  const logout = await mf.dispatchFetch('https://www.tidesofknowing.com/auth/logout/?redirectTo=%2Fstudio%2F', { method: 'POST', redirect: 'manual' });
  assert.equal(logout.status, 303); assert.equal(logout.headers.get('location'), '/studio/?signed_out=true');
  const home = await mf.dispatchFetch('https://www.tidesofknowing.com/');
  assert.equal(home.status, 488); assert.equal(await home.text(), 'synthetic Pages origin');
});
