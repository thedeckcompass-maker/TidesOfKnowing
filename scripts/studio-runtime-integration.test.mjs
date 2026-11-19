import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';

// Real provider factories and their relative dependencies. Only the external
// Supabase/pg transports are synthetic. There is no network or filesystem write
// capability inside the module contexts, and unexpected imports fail closed.
const root = path.resolve(import.meta.dirname, '..');
const modules = new Map();
export const sourceHashes = {};
function load(relative) {
  const file = path.resolve(root, relative);
  assert(file.startsWith(root + path.sep));
  if (modules.has(file)) return modules.get(file).exports;
  const source = fs.readFileSync(file, 'utf8');
  sourceHashes[path.relative(root, file).replaceAll('\\', '/')] = createHash('sha256').update(source).digest('hex');
  const module = { exports: {} };
  modules.set(file, module);
  const code = ts.transpileModule(source.replaceAll('import.meta.env', '({})'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) {
      if (name === 'node:crypto') return { createHash };
      if (name === '@supabase/supabase-js' || name === '@supabase/ssr') {
        const deny = () => { throw Error('External SDK creation is forbidden in this integration fixture'); };
        return { createClient: deny, createServerClient: deny, parseCookieHeader: deny };
      }
      assert(name.startsWith('.'), `Unexpected external import: ${name}`);
      const target = name.endsWith('.ts') ? name : name + '.ts';
      return load(path.relative(root, path.resolve(path.dirname(file), target)));
    },
    URL, Request, Response, Headers, TextEncoder, TextDecoder, Uint8Array,
    Blob, FormData, URLSearchParams, structuredClone, crypto: webcrypto,
    console: { error() {} }
  }, { filename: relative });
  return module.exports;
}

const runtime = load('src/lib/studio/runtimeComposition.ts');
const configuration = load('src/lib/studio/runtimeEnvironment.ts');
const { SNAPSHOT_TABLES } = load('src/lib/studio/projectSnapshot.ts');
const { CREATIVE_CHAPTERS } = load('src/lib/studio/communityChapters.ts');
const actor = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const project = '33333333-3333-4333-8333-333333333333';
const record = '44444444-4444-4444-8444-444444444444';
const key = '55555555-5555-4555-8555-555555555555';
const recipient = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const origin = 'https://www.tidesofknowing.com';
const flags = ['services', 'exchange', 'community', 'exports', 'artists', 'artistPortfolio'];
const outputs = {
  services: 'studioServiceRecords', exchange: 'studioExchangeProvider',
  community: 'studioSupportProvider', exports: 'studioProjectSnapshotProvider',
  artists: 'studioArtistRegistrationProvider', artistPortfolio: 'studioArtistPortfolioProvider'
};
const plain = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const calls = { auth: 0, rpc: [], queries: [], connections: 0, ends: 0, storage: 0 };
  const state = { user: actor, dbActor: actor, role: 'member', status: 'active', rpcError: null, corruptMedia: false,
    ledger: { entries: [], groups: [], quotes: [], receipts: [] } };
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const sha = createHash('sha256').update(bytes).digest('hex');
  const editorial = {
    version: 1, consistent_snapshot: true,
    requests: [{ id: record, owner_id: actor, recipient_id: recipient, project_id: project,
      snapshot_version: 1, source_kind: 'card', source_id: key, source_version: 1,
      source_version_id: key, source_fingerprint: 'a'.repeat(64), title: 'Synthetic card',
      selected_text: 'Synthetic selected passage', selected_image: '', question: 'A synthetic editorial question?',
      constraints: '', submission_key: key, prior_request_id: null, status: 'replied', revision: 1 }],
    replies: [{ id: key, request_id: record, author_id: recipient, submission_key: key,
      visibility: 'participants', body: 'Synthetic editorial reply' }]
  };
  const snapshot = {
    version: 1, ownerId: actor, projectId: project, coverage: 'project-and-editorial-v1',
    tables: Object.fromEntries(SNAPSHOT_TABLES.map(table => [table, []])), editorial
  };
  snapshot.tables.studio_projects = [{ id: project, owner_id: actor, name: 'Synthetic deck', settings: {} }];
  snapshot.tables.studio_cards = [{ id: record, project_id: project, title: 'Synthetic card', body: 'Synthetic writing' }];
  snapshot.tables.studio_journal_entries = [{ id: key, project_id: project, body: 'Synthetic journal' }];
  const profiles = () => [{ id: actor, status: state.status, role: state.role }, { id: recipient, status: 'active', role: 'admin' }];
  const client = {
    auth: { async getUser() { calls.auth++; return { data: { user: state.user ? { id: state.user } : null }, error: null }; } },
    from(table) {
      assert.equal(table, 'profiles', 'Only the editorial profile read is expected');
      const filters = {};
      const q = { select() { return q; }, eq(k, v) { filters[k] = v; return q; },
        async maybeSingle() { return { data: profiles().find(p => p.id === filters.id) ?? null, error: null }; } };
      return q;
    },
    async rpc(name, args) {
      calls.rpc.push({ name, args: plain(args ?? {}) });
      if (state.rpcError === name) return { data: null, error: { message: 'Synthetic missing contract' } };
      const results = {
        studio_dcs_community_member_context_v1: () => ({ id: state.user, status: state.status, role: state.role, general_community: true, private_community: true }),
        studio_dcs_community_read_v1: () => ({ posts: CREATIVE_CHAPTERS.map((chapter, i) => ({
          id: `${i}`, chapter: chapter.id, capability: i % 2 ? 'private_community' : 'general_community',
          question: 'Synthetic community question', replies: [] })) }),
        studio_dcs_community_submit_v1: () => ({ id: record, unchanged: false }),
        studio_dcs_community_member_reply_v2: () => record,
        studio_dcs_community_activity_read_v1: () => [{ id: record }],
        studio_dcs_community_activity_ack_v1: () => true,
        studio_editorial_history_access_v1: () => true,
        studio_editorial_owner_history_v1: () => editorial,
        studio_project_export_snapshot_v1: () => snapshot,
        studio_exchange_export_snapshot_v1: () => ({ ownerId: actor, projectId: project, revision: 2, rows: [{ id: record }] })
      };
      assert(name in results, `Unexpected RPC: ${name}`);
      return { data: structuredClone(results[name]()), error: null };
    },
    storage: { from(bucket) {
      assert.equal(bucket, 'studio-artist-previews');
      return { async download(objectPath) {
        calls.storage++; assert.equal(objectPath, `${actor}/${record}.jpg`);
        return { data: new Blob([state.corruptMedia ? new Uint8Array([9]) : bytes]), error: null };
      } };
    } }
  };
  const pg = () => {
    calls.connections++;
    return {
      async connect() {}, async end() { calls.ends++; },
      async query(sql, values) {
        calls.queries.push({ sql, values: plain(values ?? []) });
        if (/^(BEGIN|SET LOCAL ROLE|COMMIT|ROLLBACK)/.test(sql) || sql.includes('set_config(')) return { rows: [] };
        if (sql.includes('current_setting(')) return { rows: [{ actor: state.dbActor }] };
        if (sql.includes('artist_portfolio_dispatch_v1')) {
          if (values[0] === 'directory') return { rows: [{ value: [{ portfolio_examples: [{ url: `/api/artists/portfolio/${record}/` }] }] }] };
          if (values[0] === 'preview') return { rows: [{ value: { object_path: `${actor}/${record}.jpg`, byte_size: bytes.length, sha256: sha } }] };
          assert.fail(`Unexpected portfolio action: ${values[0]}`);
        }
        if (sql.includes('exchange_dispatch_v1')) return { rows: [{ value: { action: values[0], input: JSON.parse(values[1]) } }] };
        if (sql.startsWith('UPDATE studio_private.service_ledger_v1')) { state.ledger = JSON.parse(values[0]); return { rows: [] }; }
        if (sql.startsWith('INSERT INTO studio_private.service_receipts_v1')) return { rows: [] };
        if (sql.includes('service_ledger_v1')) return { rows: [{ body: structuredClone(state.ledger) }] };
        if (sql.includes('service_actor_profiles_v1')) return { rows: profiles() };
        if (/^SELECT/.test(sql) && /service_assessment_links_v1|service_receipts_v1|public.studio_projects/.test(sql)) return { rows: [] };
        assert.fail(`Unexpected SQL in synthetic transport: ${sql}`);
      }
    };
  };
  const locals = { supabase: client, user: { id: actor }, profile: { id: actor, status: 'active', role: 'member' } };
  const config = selected => configuration.studioRuntimeConfiguration({
    STUDIO_RUNTIME_ENABLED: 'true', STUDIO_DEPLOYMENT_TARGET: 'production',
    PUBLIC_SUPABASE_URL: 'https://vbdqvjvhjleqdadiiqjx.supabase.co',
    DCS_EXCHANGE_DB: { connectionString: 'postgres://synthetic.invalid/fixture' },
    STUDIO_RUNTIME_CONFIG_JSON: JSON.stringify({ ...Object.fromEntries(flags.map(f => [f, selected.includes(f)])), recipientId: recipient, historyPolicy: 'deny' })
  }, origin);
  const compose = async (selected = flags) => Object.assign(locals, await runtime.composeDcsRuntime(locals, config(selected), pg));
  return { calls, state, locals, snapshot, editorial, compose, config };
}

test('default-off composition performs no authentication, RPC or pg work', async () => {
  const f = fixture(); const result = await runtime.composeDcsRuntime(f.locals);
  for (const field of Object.values(outputs)) assert.equal(result[field], null);
  assert.equal(f.calls.auth + f.calls.rpc.length + f.calls.connections, 0);
});

for (const selected of flags) test(`real ${selected} factory composes independently without opening a connection`, async () => {
  const f = fixture(); const result = await f.compose([selected]);
  for (const [flag, field] of Object.entries(outputs)) assert.equal(Boolean(result[field]), flag === selected);
  assert.equal(f.calls.connections, 0); assert.equal(f.calls.rpc.length, 0);
});

test('all six providers coexist; real artist and Exchange calls preserve actor/transaction contract', async () => {
  const f = fixture(); const result = await f.compose();
  for (const field of Object.values(outputs)) assert(result[field]);
  const registration = await result.studioArtistRegistrationProvider.registration(actor);
  assert.equal(registration.action, 'registration');
  const board = await result.studioExchangeProvider.exchangeBoard(actor, record);
  assert.equal(board.action, 'board'); assert.equal(board.input.id, record);
  assert.equal(f.calls.connections, 2); assert.equal(f.calls.ends, 2);
  for (const q of f.calls.queries.filter(q => q.sql.includes('set_config('))) assert.equal(q.values[0], actor);
  assert.equal(f.calls.queries.filter(q => q.sql === 'SET LOCAL ROLE dcs_service_executor').length, 2);
  assert.equal(f.calls.queries.filter(q => q.sql === 'COMMIT').length, 2);
});

test('real Community provider returns all eight chapters and accepts reviewed standalone input', async () => {
  const f = fixture(); const result = await f.compose(); const provider = result.studioSupportProvider;
  const read = await provider.read(actor);
  assert.deepEqual(plain(read.posts.map(p => p.chapter)), plain(CREATIVE_CHAPTERS.map(c => c.id)));
  assert.equal(read.channels.length, 2);
  await provider.submit(actor, { project_id: null, submission_key: key, chapter: 'spark', capability: 'general_community',
    question: 'Synthetic standalone community question', selected_text: '', reviewed: true });
  const sent = f.calls.rpc.find(c => c.name === 'studio_dcs_community_submit_v1');
  assert.equal(sent.args.p_project, null); assert.equal(sent.args.p_selected, '');
  await provider.memberActivityAck(actor, (await provider.memberActivityRead(actor))[0].id);
  assert.equal(f.calls.connections, 0);
});

test('real editorial service preserves nonempty owner history and deny-expiry argument', async () => {
  const f = fixture(); const result = await f.compose();
  const read = await result.studioSupportProvider.editorialRead(actor, project, false);
  assert.equal(read.staff, false); assert.equal(read.requests[0].selected_text, 'Synthetic selected passage');
  assert.equal(read.requests[0].replies[0].body, 'Synthetic editorial reply');
  const access = f.calls.rpc.find(c => c.name === 'studio_editorial_history_access_v1');
  assert.equal(access.args.p_allow_expired, false); assert.equal(access.args.p_project, project);
});

test('real service provider reads through restricted private repository and closes transaction', async () => {
  const f = fixture(); const result = await f.compose(); const read = await result.studioServiceRecords.read(actor);
  assert.deepEqual(plain(read), { quotes: [], entries: [], groups: [] });
  assert.equal(f.calls.connections, 1); assert.equal(f.calls.ends, 1);
  assert(f.calls.queries.some(q => q.sql === 'COMMIT'));
  assert(!f.calls.queries.some(q => /^(INSERT|UPDATE|DELETE)/.test(q.sql)));
});

test('real artist directory hydrates exact private origin and verifies original byte hash', async () => {
  const f = fixture(); const result = await f.compose(); const provider = result.studioArtistPortfolioProvider;
  assert.equal((await provider.directory(actor))[0].portfolio_examples[0].url, `${origin}/api/artists/portfolio/${record}/`);
  assert.deepEqual(Array.from(await provider.preview(actor, record)), [1, 2, 3, 4]);
  f.state.corruptMedia = true;
  await assert.rejects(() => provider.preview(actor, record), /verification failed/);
});

test('real project and Exchange export providers return owned nonempty coherent snapshots', async () => {
  const f = fixture(); const result = await f.compose();
  const saved = await result.studioProjectSnapshotProvider.capture(actor, project);
  const exchange = await result.studioExchangeSnapshotProvider.capture(actor, project);
  assert.equal(saved.tables.studio_cards[0].body, 'Synthetic writing');
  assert.equal(saved.tables.studio_journal_entries.length, 1);
  assert.equal(saved.editorial.requests[0].selected_text, 'Synthetic selected passage');
  assert.equal(exchange.rows.length, 1); assert.equal(exchange.revision, 2);
  saved.tables.studio_cards[0].body = 'Changed returned copy';
  assert.equal(f.snapshot.tables.studio_cards[0].body, 'Synthetic writing');
  const before = f.calls.rpc.length;
  await assert.rejects(() => result.studioProjectSnapshotProvider.capture(other, project), /Sign in again/);
  assert.equal(f.calls.rpc.length, before);
});

test('missing Community and snapshot contracts fail closed without another transport fallback', async () => {
  const f = fixture(); const result = await f.compose();
  f.state.rpcError = 'studio_dcs_community_member_context_v1';
  await assert.rejects(() => result.studioSupportProvider.read(actor), /Current account access/);
  f.state.rpcError = 'studio_project_export_snapshot_v1';
  await assert.rejects(() => result.studioProjectSnapshotProvider.capture(actor, project), /No incomplete ZIP/);
  f.state.rpcError = 'studio_exchange_export_snapshot_v1';
  await assert.rejects(() => result.studioExchangeSnapshotProvider.capture(actor, project), /No incomplete archive/);
  assert.equal(f.calls.connections, 0); assert.equal(f.calls.storage, 0);
});

test('changed identities deny exports and private artist access without publishing or committing', async () => {
  const f = fixture(); const result = await f.compose();
  const before = f.calls.connections;
  await assert.rejects(() => result.studioArtistPortfolioProvider.directory(other), /identity mismatch/);
  assert.equal(f.calls.connections, before);
  f.state.dbActor = other;
  await assert.rejects(() => result.studioArtistRegistrationProvider.registration(actor), /not confirmed/);
  assert(f.calls.queries.some(q => q.sql === 'ROLLBACK'));
  assert(!f.calls.queries.some(q => q.sql === 'COMMIT'));
  assert.equal(f.calls.ends, 1);
  f.state.user = other;
  const count = f.calls.rpc.length;
  await assert.rejects(() => result.studioExchangeSnapshotProvider.capture(actor, project), /Sign in again/);
  assert.equal(f.calls.rpc.length, count);
});

test('unverified, inactive and mismatched request contexts receive no providers', async () => {
  for (const mode of ['signed-out', 'mismatch', 'inactive']) {
    const f = fixture();
    if (mode === 'signed-out') f.state.user = null;
    if (mode === 'mismatch') f.locals.profile.id = other;
    if (mode === 'inactive') f.locals.profile.status = 'suspended';
    const result = await f.compose();
    for (const field of Object.values(outputs)) assert.equal(result[field], null);
    assert.equal(f.calls.rpc.length + f.calls.connections, 0);
  }
});

function post(url, input, requestOrigin = origin) {
  return new Request(origin + url, { method: 'POST', headers: { Origin: requestOrigin }, body: new URLSearchParams(input) });
}

test('actual Community route hands reviewed standalone input to composed provider; foreign origin stops before RPC', async () => {
  const route = load('src/pages/api/studio/contextual-support.ts');
  const f = fixture(); const locals = await f.compose();
  const read = await route.GET({ locals });
  assert.equal(read.status, 200); assert.equal((await read.json()).posts.length, 8);
  const input = { chapter: 'spark', capability: 'private_community', question: 'A synthetic standalone creator question',
    project_id: '', selected_text: '', submission_key: key, reviewed: 'on' };
  const response = await route.POST({ locals, request: post('/api/studio/contextual-support', input) });
  assert.equal(response.status, 200); assert.equal((await response.json()).id, record);
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  const count = f.calls.rpc.length;
  assert.equal((await route.POST({ locals, request: post('/api/studio/contextual-support', input, 'https://foreign.invalid') })).status, 403);
  assert.equal(f.calls.rpc.length, count);
});

test('actual member-action and activity routes use real composed providers', async () => {
  const actions = load('src/pages/api/studio/community-member-actions.ts');
  const activity = load('src/pages/api/studio/community-activity.ts');
  const f = fixture(); const locals = await f.compose();
  const reply = await actions.POST({ locals, request: post('/api/studio/community-member-actions', {
    action: 'reply', post_id: record, parent_id: '', submission_key: key, body: 'Synthetic member response'
  }) });
  assert.equal(reply.status, 200); assert.equal((await reply.json()).id, record);
  const notifications = await activity.GET({ locals });
  assert.equal(notifications.status, 200); assert.equal((await notifications.json()).activities[0].id, record);
  f.state.rpcError = 'studio_dcs_community_activity_read_v1';
  assert.equal((await activity.GET({ locals })).status, 503);
});

test('actual editorial route returns composed private conversation with its reply', async () => {
  const route = load('src/pages/api/studio/editorial-local.ts');
  const f = fixture(); const locals = await f.compose();
  const response = await route.GET({ locals, url: new URL(`${origin}/api/studio/editorial-local?project=${project}`) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).requests[0].replies[0].body, 'Synthetic editorial reply');
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
});

test('actual artist preview route returns verified bytes privately; signed-out request never reaches storage', async () => {
  const route = load('src/pages/api/artists/portfolio/[id].ts');
  const f = fixture(); const locals = await f.compose();
  const response = await route.GET({ locals, params: { id: record } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  assert.deepEqual(Array.from(new Uint8Array(await response.arrayBuffer())), [1, 2, 3, 4]);
  const count = f.calls.storage;
  assert.equal((await route.GET({ locals: { ...locals, user: null }, params: { id: record } })).status, 404);
  assert.equal(f.calls.storage, count);
});

test('actual service route accepts no-project quotation enquiry without payment or allocations', async () => {
  const route = load('src/pages/api/studio/service-records.ts');
  const f = fixture(); const locals = await f.compose();
  const response = await route.serviceRecordPost(() => { assert.fail('No recipient lookup needed for an enquiry'); })({
    locals, request: post('/api/studio/service-records', { action: 'request-quote', key,
      category: 'proofreading', project: 'Synthetic unsaved deck', outcome: 'Synthetic proofreading enquiry only' })
  });
  assert.equal(response.status, 200);
  assert.equal(f.state.ledger.quotes.length, 1); assert.equal(f.state.ledger.quotes[0].ownerId, actor);
  assert.equal(f.state.ledger.entries.length, 0); assert.equal(f.state.ledger.groups.length, 0);
  assert.equal(f.calls.connections, 1); assert.equal(f.calls.ends, 1);
  assert(f.calls.queries.some(q => q.sql === 'COMMIT'));
});
