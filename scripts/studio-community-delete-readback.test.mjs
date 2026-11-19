import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import ts from 'typescript';
import puppeteer from 'puppeteer';

const post = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const reply = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const child = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const script = ts.transpileModule(fs.readFileSync(new URL('../src/scripts/studioCommunityConversation.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;

async function scenario({ hasChildren = false, focused = false, cursor = false, stillPublished = false } = {}) {
  let deleted = false; const reads = [];
  const form = `<form method="post" action="/api/studio/community-member-actions" data-member-mutation data-has-children="${hasChildren}"><input name="action" value="delete"><input name="reply_id" value="${reply}"><input name="expected_updated_at" value="2026-01-01T00:00:00Z"><button type="submit">Delete</button><p data-mutation-error hidden></p></form>`;
  const nested = hasChildren ? `<details class="dcs-thread__nested" open><summary>Replies</summary><div class="dcs-thread__branch"><div id="reply-${child}" data-comment-id="${child}">Peer reply</div></div></details>` : '';
  function page() {
    const show = !deleted || stillPublished || (hasChildren && !focused);
    const item = show ? `<article class="dcs-thread__group"><div id="reply-${reply}" data-comment-id="${reply}" data-deleted="${deleted && !stillPublished}">${deleted && !stillPublished ? 'Comment deleted' : form}</div>${nested}</article>` : '';
    return `<main data-community-thread="${post}"><div class="dcs-thread__responses">${item}</div><p data-thread-status></p></main><script src="/client.js"></script>`;
  }
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/client.js') { res.setHeader('content-type', 'text/javascript'); return res.end(script); }
    if (url.pathname === '/api/studio/community-member-actions') { deleted = true; res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ id: reply })); }
    reads.push(url.searchParams.toString());
    if (deleted && url.searchParams.has('reply')) { res.statusCode = 404; return res.end('focus requires a published reply'); }
    res.setHeader('content-type', 'text/html'); res.end(page());
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
    const tab = await browser.newPage(); const pageErrors = []; tab.on('pageerror', error => pageErrors.push(error.message)); tab.on('dialog', dialog => dialog.accept());
    const params = new URLSearchParams(); if (focused) params.set('reply', reply); if (cursor) params.set('replies', 'synthetic-cursor');
    await tab.goto(`http://127.0.0.1:${server.address().port}/thread?${params}`);
    await tab.click('button[type=submit]');
    try { await tab.waitForFunction(() => document.querySelector('[data-thread-status]')?.textContent || !document.querySelector('[data-mutation-error]')?.hidden, { timeout: 4000 }); }
    catch { throw new Error('Synthetic browser did not complete: ' + JSON.stringify({ pageErrors, reads, deleted, buttonDisabled: await tab.$eval('button[type=submit]', el => el.disabled) })); }
    const state = await tab.evaluate(() => ({ notice: document.querySelector('[data-thread-status]')?.textContent, error: document.querySelector('[data-mutation-error]')?.textContent, replyPresent: !!document.querySelector('[data-comment-id]'), childPresent: !!document.querySelector('[data-comment-id="cccccccc-cccc-4ccc-8ccc-cccccccccccc"]'), deleted: document.getElementById('reply-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')?.dataset.deleted }));
    return { reads, state };
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}

test('deleted leaf is read back without deleted-reply focus and keeps page cursor', async () => {
  const { reads, state } = await scenario({ cursor: true });
  assert.equal(state.notice, 'Comment deleted.'); assert.equal(state.replyPresent, false);
  const read = new URLSearchParams(reads.at(-1)); assert.equal(read.has('reply'), false); assert.equal(read.get('replies'), 'synthetic-cursor');
});
test('deleted parent keeps the published child and displays a tombstone', async () => {
  const { reads, state } = await scenario({ hasChildren: true });
  assert.equal(state.notice, 'Comment deleted.'); assert.equal(state.deleted, 'true'); assert.equal(state.childPresent, true); assert.equal(new URLSearchParams(reads.at(-1)).has('reply'), false);
});
test('focused deletion outside readback page does not claim success', async () => {
  const { state } = await scenario({ hasChildren: true, focused: true });
  assert.equal(state.notice, ''); assert.match(state.error, /could not be confirmed/); assert.equal(state.childPresent, true);
});
test('still-published reply in readback does not claim success', async () => {
  const { state } = await scenario({ stillPublished: true });
  assert.equal(state.notice, ''); assert.match(state.error, /could not be confirmed/);
});
