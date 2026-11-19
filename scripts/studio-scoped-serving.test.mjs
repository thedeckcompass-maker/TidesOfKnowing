import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { classifyDcsRequest, explicitDcsReturn, withScopedDcs, ASSET_PREFIX, PUBLIC_ORIGIN } from '../src/worker-adapters/dcs-scoped.mjs';
import { a as safeRedirect } from '../dist/server/chunks/authCallback_Cy_QL8nC.mjs';

const prepared = 'C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-SCOPED-PUBLIC-RELEASE-20261109-v2';
const manifest = JSON.parse(fs.readFileSync(path.join(prepared, 'asset-manifest.json'), 'utf8'));
const request = (url, options) => new Request(new URL(url, PUBLIC_ORIGIN), options);
const classify = (url, options) => classifyDcsRequest(request(url, options), safeRedirect);
const post = (url, fields) => request(url, { method: 'POST', headers: { Origin: PUBLIC_ORIGIN }, body: new URLSearchParams(fields) });

test('explicit returns do not inherit the accepted normalizer’s default-to-Studio behaviour', () => {
  for (const value of ['', null, '/community/', 'https://foreign.invalid', '//foreign.invalid', '/studio/../admin', '/studio/%2e%2e/admin', '/artists/unrelated', '/api/studio/x']) assert.equal(explicitDcsReturn(value, safeRedirect), null, value);
  for (const value of ['/studio/', '/studio/projects/test/', '/artists/collaborate/', '/artists/visual-design-exchange/', '/community/account/?workspace=studio']) assert(explicitDcsReturn(value, safeRedirect), value);
});

test('product route families reach the app; boundary lookalikes and public handlers stay Pages', async () => {
  for (const url of ['/studio', '/studio/', '/studio/projects/p/guidebook/s/', '/api/studio/projects', '/api/artists/portfolio/p/', '/artists/collaborate/', '/artists/visual-design-exchange/', '/ask-leilia/admin/studio-access/', '/community/account/?workspace=studio', '/deck-creator-studio/checkout/?offer=create&billing=monthly']) assert.equal((await classify(url)).target, 'app', url);
  for (const url of ['/', '/articles/existing/', '/deck-creator-studio/', '/robots.txt', '/sitemap-index.xml', '/_astro/existing.js', '/images/existing.jpg', '/studioevil/', '/api/studioevil', '/artists/unrelated/', '/ask-leilia/admin/', '/community/account/', '/community/existing-public-thread/', '/api/contact', '/api/newsletter-subscribe', '/api/ask-leilia/checkout', '/api/ask-leilia/stripe-webhook']) assert.equal((await classify(url)).target, 'pages', url);
  for (const url of ['/studio/community-local/', '/studio/community-lab/x/', '/studio/avatar-lab/', '/api/studio%2Fprojects', '/studio/projects/%2fsecret']) assert.equal((await classify(url)).target, 'reject', url);
});

test('every selected compiled product/shared component has an explicit routing case', async () => {
  for (const component of manifest.routeComponents) {
    let url = '/' + component.replace(/^src\/pages\//, '').replace(/(?:\/index)?\.(?:astro|ts)$/, '/');
    url = url.replace(/\[\.\.\.([^\]]+)\]/g, 'synthetic').replace(/\[([^\]]+)\]/g, '11111111-1111-4111-8111-111111111111');
    if (url.startsWith('/auth/')) url += '?redirectTo=%2Fstudio%2F';
    if (url.startsWith('/community/account')) url += '?workspace=studio';
    assert.equal((await classify(url)).target, component === 'src/pages/community/sections/deck-creator-studio/index.astro' ? 'redirect' : 'app', component);
  }
});

test('DCS query auth and hidden-form resend reach the accepted app without consuming the original', async () => {
  for (const url of ['/auth/login/?redirectTo=%2Fstudio%2F', '/auth/register/?mode=join&redirectTo=%2Fartists%2Fcollaborate%2F', '/auth/callback/?code=synthetic&redirectTo=%2Fstudio%2F', '/auth/check-email/?redirectTo=%2Fstudio%2F', '/auth/logout/?redirectTo=%2Fstudio%2F']) assert.equal((await classify(url)).target, 'app', url);
  for (const url of ['/auth/register/', '/auth/logout/', '/auth/callback/?code=synthetic', '/auth/register/?redirectTo=https%3A%2F%2Fforeign.invalid', '/auth/register/?redirectTo=%2Fcommunity%2F']) assert.equal((await classify(url)).target, 'pages', url);
  assert.equal((await classify('/auth/callback/?redirectTo=/studio/&redirectTo=/community/')).target, 'reject');
  const r = post('/auth/register/', { email: 'synthetic@example.invalid', redirectTo: '/studio/', action: 'sign-in' });
  const copy = r.clone(); assert.equal((await classifyDcsRequest(r, safeRedirect)).target, 'app');
  assert.equal(await r.text(), await copy.text());
  const form = new FormData(); form.set('redirectTo', '/artists/collaborate/'); form.set('email', 'synthetic@example.invalid');
  assert.equal((await classifyDcsRequest(request('/auth/register/', { method: 'POST', body: form }), safeRedirect)).target, 'app');
});

test('bounded malformed/duplicate public auth bodies stay on Pages without disclosure', async () => {
  for (const body of [new URLSearchParams([['redirectTo', '/studio/'], ['redirectTo', '/community/']]), new URLSearchParams({ redirectTo: '/community/' }), new URLSearchParams({ padding: 'x'.repeat(66000), redirectTo: '/studio/' })]) {
    const r = request('/auth/register/', { method: 'POST', body });
    assert.equal((await classifyDcsRequest(r, safeRedirect)).target, 'pages');
    assert((await r.text()).length > 0);
  }
});

test('Pages forwarding preserves original POST bytes, signature, cookies, redirect and response identity', async () => {
  const r = request('/api/ask-leilia/stripe-webhook', { method: 'POST', body: '{"synthetic":"exact bytes"}', headers: { 'stripe-signature': 'synthetic-only', cookie: 'synthetic=fixture' } });
  const response = new Response(null, { status: 302, headers: { location: '/existing/' } });
  let calls = 0;
  const adapter = withScopedDcs({ fetch() { assert.fail('Public POST entered app'); } }, async (received, init) => {
    calls++; assert.equal(received, r); assert.deepEqual(init, { redirect: 'manual' });
    assert.equal(await received.text(), '{"synthetic":"exact bytes"}'); assert.equal(received.headers.get('stripe-signature'), 'synthetic-only');
    assert.equal(received.headers.get('cookie'), 'synthetic=fixture'); return response;
  }, manifest, safeRedirect);
  assert.equal(await adapter.fetch(r, {}, {}), response); assert.equal(calls, 1);
});

test('guarded PDF GET/HEAD stay in accepted app; public POST remains Pages', async () => {
  for (const url of ['/api/ask-leilia/requests/synthetic/delivery-pdf', '/api/reading-library/synthetic/pdf/']) {
    for (const method of ['GET', 'HEAD']) assert.equal((await classify(url, { method })).target, 'app');
    assert.equal((await classify(url, { method: 'POST' })).target, 'pages');
  }
  assert.equal((await classify('/api/studio/quotation-evidence/synthetic')).target, 'app');
  assert.equal((await classify('/api/reading-library/caf%C3%A9/pdf/')).target, 'app');
  assert.equal((await classify('/api/ask-leilia/requests/synthetic/%64elivery-pdf')).target, 'app');
  assert.equal((await classify('/api/ask-leilia/requests/synthetic/%2564elivery-pdf')).target, 'reject');
  assert.equal((await classify('/api/ask-leilia/requests/synthetic%2Fextra/delivery-pdf')).target, 'reject');
});

test('private hosts never delegate to Pages; app denial/error never falls back or retries', async () => {
  const denied = new Response('denied', { status: 403 }); let calls = 0;
  const adapter = withScopedDcs({ fetch() { calls++; return denied; } }, () => assert.fail('Unexpected origin fallback'), manifest, safeRedirect);
  for (const url of ['https://tidesofknowing-consolidated.tidesofknowing.workers.dev/', 'https://e20cc524-tidesofknowing-consolidated.tidesofknowing.workers.dev/', PUBLIC_ORIGIN + '/api/studio/projects']) assert.equal(await adapter.fetch(new Request(url), {}, {}), denied);
  assert.equal(calls, 3);
  const broken = withScopedDcs({ fetch() { throw Error('Synthetic app failure'); } }, () => assert.fail('No fallback'), manifest, safeRedirect);
  await assert.rejects(() => broken.fetch(request('/api/studio/projects'), {}, {}), /Synthetic app failure/);
});

test('isolated asset lookup uses only pinned original paths; unknown files and methods fail closed', async () => {
  const first = Object.keys(manifest.assets)[0]; let calls = 0;
  const adapter = withScopedDcs({ fetch() { assert.fail('Asset entered app'); } }, () => assert.fail('Asset reached Pages'), manifest, safeRedirect);
  const result = new Response('synthetic asset');
  const env = { ASSETS: { async fetch(r) { calls++; assert.equal(new URL(r.url).pathname, first); assert.equal(new URL(r.url).search, '?v=fixture'); return result; } } };
  assert.equal(await adapter.fetch(request(ASSET_PREFIX + first + '?v=fixture'), env, {}), result);
  for (const url of [ASSET_PREFIX + '/server/entry.mjs', ASSET_PREFIX + '/_astro/not-pinned.js', ASSET_PREFIX + first + '.map']) assert.equal((await adapter.fetch(request(url), env, {})).status, 404);
  assert.equal((await adapter.fetch(request(ASSET_PREFIX + first, { method: 'POST' }), env, {})).status, 405);
  assert.equal((await adapter.fetch(request(ASSET_PREFIX + first), {}, {})).status, 503);
  assert.equal(calls, 1);
});

test('all pinned asset bytes match accepted files and namespace-relative references remain inside it', () => {
  for (const [url, meta] of Object.entries(manifest.assets)) {
    const bytes = fs.readFileSync(new URL('../dist/client' + url, import.meta.url));
    assert.equal(bytes.length, meta.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), meta.sha256);
    if (/\.(js|mjs|css)$/.test(url)) assert(!/["'`]\/_astro\//.test(bytes.toString()), url);
  }
});

test('review routes never cover whole www or original public asset namespace', () => {
  const routes = JSON.parse(fs.readFileSync(path.join(prepared, 'routes.REVIEW.json'), 'utf8'));
  assert.equal(routes.wholeWwwRoute, false); assert.equal(routes.dnsChanges, false);
  assert(!routes.patterns.includes(PUBLIC_ORIGIN + '/*'));
  assert(!routes.patterns.some(p => p.includes('/_astro/')));
});

test('private Community entry alias points to the final canonical interface without reading data or granting access', async () => {
  const adapter = withScopedDcs({ fetch() { assert.fail('Alias must not render the older interface'); } }, () => assert.fail('No Pages fallback'), manifest, safeRedirect);
  const r = await adapter.fetch(request('/community/sections/deck-creator-studio/?page=2'), {}, {});
  assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/studio/private-community/');
  assert.equal(r.headers.get('cache-control'), 'private, no-store');
  assert.equal((await classify('/community/sections/deck-creator-studio/', { method: 'POST' })).target, 'app');
});
