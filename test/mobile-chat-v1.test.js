const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const file = join(__dirname, '..', 'src', 'mobile', `${name}.ts`);
  const source = readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  cache.set(name, module.exports);
  new Function('exports', 'require', 'module', code)(module.exports,
    (id) => id.startsWith('./') ? load(id.slice(2)) : require(id), module);
  return module.exports;
}
const { mobileAuthConfig } = load('auth-config');
const { createMobileChatApi, resolveMobileChatApiBase, ChatApiError } = load('chat-api');
const { MobileChatEngine } = load('chat-engine');
const id = (number) => `${String(number).padStart(8, '0')}-1111-4111-8111-111111111111`;

test('missing Auth0 public config fails closed and native Chat defaults to production', () => {
  assert.throws(() => mobileAuthConfig({}), /MOBILE_AUTH_NOT_CONFIGURED/);
  assert.throws(() => mobileAuthConfig({ EXPO_PUBLIC_AUTH0_ISSUER_BASE_URL: 'http://bad',
    EXPO_PUBLIC_AUTH0_MOBILE_CLIENT_ID: 'fake-client-id', EXPO_PUBLIC_AUTH0_AUDIENCE: 'https://api.test' }));
  const config = mobileAuthConfig({ EXPO_PUBLIC_AUTH0_ISSUER_BASE_URL: 'https://issuer.test/',
    EXPO_PUBLIC_AUTH0_MOBILE_CLIENT_ID: 'public-client-id', EXPO_PUBLIC_AUTH0_AUDIENCE: 'https://api.test' });
  assert.equal(config.apiBase, 'https://api.enkhsystems.com');
  assert.equal(resolveMobileChatApiBase(), 'https://api.enkhsystems.com');
  assert.throws(() => createMobileChatApi(async () => 'token', fetch, 'https://untrusted.example'));
});

test('explicit test HTTPS origin is allowed; malformed and insecure overrides fail before token access', async () => {
  const nativeScreen = readFileSync(join(__dirname, '..', 'src', 'components', 'mobile-chat.native.tsx'), 'utf8');
  assert.match(nativeScreen, /resolveMobileChatApiBase\(process\.env\.EXPO_PUBLIC_ENKH_CHAT_API_URL\)/);
  assert.match(nativeScreen, /import \{ fetch as expoFetch \} from 'expo\/fetch'/);
  assert.match(nativeScreen, /createMobileChatApi\(mobileAccessToken, expoFetch/);
  const testOrigin = 'https://api-test.enkhsystems.com';
  assert.equal(resolveMobileChatApiBase(testOrigin), testOrigin);
  let tokenCalls = 0;
  const calls = [];
  const api = createMobileChatApi(async () => { tokenCalls++; return 'fixture-token'; },
    async (url, options) => { calls.push({ url, options });
      return { ok: true, json: async () => ({ success: true, cursor: 0 }) }; },
    resolveMobileChatApiBase(testOrigin));
  await api.sync({ conversations: [], messages: [] });
  assert.equal(calls[0].url, `${testOrigin}/api/chat/sync`);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-token');
  assert.equal(calls[0].options.redirect, 'error');
  for (const invalid of ['', 'http://api-test.enkhsystems.com', 'http://localhost:3000',
    'https://api-test.enkhsystems.com/', 'https://api-test.enkhsystems.com/path',
    'https://api-test.enkhsystems.com?next=other', 'https://api-test.enkhsystems.com#fragment',
    'https://api-test.enkhsystems.com.evil.test', 'https://user@api-test.enkhsystems.com',
    'https://api-test.enkhsystems.com:443', 'https://untrusted.example']) {
    assert.throws(() => resolveMobileChatApiBase(invalid), /INVALID_CHAT_API_BASE/);
    assert.throws(() => createMobileChatApi(async () => { tokenCalls++; return 'fixture-token'; },
      fetch, invalid), /INVALID_CHAT_API_BASE/);
  }
  assert.equal(tokenCalls, 1);
  assert.equal(calls.length, 1);
});

test('redirects cannot carry a bearer token to a different origin', async () => {
  const calls = [];
  const api = createMobileChatApi(async () => 'fixture-token', async (url, options) => {
    calls.push({ url, options });
    throw new TypeError('redirect rejected');
  }, resolveMobileChatApiBase('https://api-test.enkhsystems.com'));
  await assert.rejects(api.sync({ conversations: [], messages: [] }),
    (error) => error instanceof ChatApiError && error.code === 'NETWORK_UNAVAILABLE');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api-test.enkhsystems.com/api/chat/sync');
  assert.equal(calls[0].options.redirect, 'error');
});

test('API uses bearer only for ENKH hostname and rejects malformed/oversized responses', async () => {
  const calls = [];
  const api = createMobileChatApi(async () => 'fixture-token', async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ success: true, answer: 'x'.repeat(12001) }) };
  }, undefined, 'android');
  await assert.rejects(api.turn({ clientConversationId: id(1), clientTurnId: id(2),
    clientMessageId: id(3), message: 'test' }), (error) => error instanceof ChatApiError && error.status === 502);
  assert.equal(calls[0].url, 'https://api.enkhsystems.com/api/chat/turns');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-token');
  assert.equal(calls[0].options.headers['X-Enkh-Client-Type'], 'android');
  assert.equal(JSON.stringify(calls[0].options).includes('clientSecret'), false);
});

test('all six authenticated Chat paths preserve cursors and never call public actions', async () => {
  const paths = [];
  const api = createMobileChatApi(async () => 'fixture-token', async (url, options) => {
    paths.push({ path: new URL(url).pathname, query: new URL(url).search, method: options.method });
    const path = new URL(url).pathname;
    const data = path.endsWith('/turns') ? { success: true, conversationId: id(1), userMessageId: id(2),
      assistantMessageId: id(3), assistantClientMessageId: id(4), answer: 'Би Энх.', duplicate: false, cursor: 4 }
      : path.endsWith('/messages') ? { success: true, messages: [], nextCursor: null }
      : path.endsWith('/conversations') ? { success: true, conversations: [], nextCursor: null }
      : path.endsWith('/changes') ? { success: true, changes: [], cursor: 4, hasMore: false }
      : { success: true, cursor: 4 };
    return { ok: true, json: async () => data };
  });
  await api.turn({ clientConversationId: id(1), clientTurnId: id(2), clientMessageId: id(3), message: 'fixture' });
  await api.conversations(2, 'cursor-test');
  await api.messages(id(1), 2, 'cursor-test');
  await api.sync({ conversations: [], messages: [], deletions: [] });
  await api.changes(4, 2);
  await api.remove(id(1));
  assert.deepEqual(paths.map((item) => item.path), ['/api/chat/turns', '/api/chat/conversations',
    `/api/chat/conversations/${id(1)}/messages`, '/api/chat/sync', '/api/chat/changes',
    `/api/chat/conversations/${id(1)}`]);
  assert.match(paths[1].query, /before=cursor-test/);
  assert.match(paths[4].query, /cursor=4/);
  assert.equal(paths.some((item) => item.path.includes('/actions/run')), false);
});

function harness() {
  const files = new Map(); const calls = []; let online = false; let serial = 10; let cursor = 0;
  const persistence = { async load(key) { return files.has(key) ? JSON.parse(files.get(key)) : null; },
    async save(key, state) { calls.push('local'); files.set(key, JSON.stringify(state)); } };
  const api = { async turn(input) { calls.push('network'); if (!online) throw new ChatApiError(0, 'NETWORK_UNAVAILABLE');
      return { success: true, conversationId: id(5), userMessageId: id(6), assistantMessageId: id(7),
        assistantClientMessageId: id(8), answer: 'Би Энх.', duplicate: calls.filter((item) => item === 'network').length > 1,
        cursor: ++cursor }; },
    async sync() { calls.push('sync'); return {}; },
    async changes() { return { changes: [], cursor, hasMore: false }; },
    async conversations() { return { conversations: [], nextCursor: null }; } };
  const create = () => new MobileChatEngine(persistence, api, () => id(serial++));
  return { files, calls, api, create, online: () => { online = true; } };
}

test('local write precedes network; offline restart reuses IDs and stores one answer', async () => {
  const h = harness(); const first = h.create(); await first.switchAccount('owner-a');
  await first.send(id(1), 'Чи хэн бэ?');
  assert.deepEqual(h.calls.slice(0, 2), ['local', 'network']);
  assert.equal(first.view().pendingTurns.length, 1);
  const original = first.view().pendingTurns[0];
  const restarted = h.create(); await restarted.switchAccount('owner-a');
  assert.deepEqual(restarted.view().pendingTurns[0], original);
  h.online(); await restarted.retryPending();
  assert.equal(restarted.view().pendingTurns.length, 0);
  assert.equal(restarted.view().messages.filter((item) => item.role === 'assistant').length, 1);
  assert.equal(restarted.view().messages.at(-1).content, 'Би Энх.');
  await restarted.retryPending();
  assert.equal(restarted.view().messages.filter((item) => item.role === 'assistant').length, 1);
});

test('account switching hides active data but preserves each stored account', async () => {
  const h = harness(); const engine = h.create(); await engine.switchAccount('owner-a');
  await engine.send(id(1), 'private fixture');
  await engine.switchAccount('owner-b'); assert.equal(engine.view().messages.length, 0);
  assert.equal(h.files.has('owner-a'), true);
  await engine.switchAccount('owner-a'); assert.equal(engine.view().messages.length, 1);
  await engine.switchAccount(null); assert.equal(engine.view().messages.length, 0);
});

test('deleting a local-only conversation never sends its unsent turn to AI', async () => {
  const h = harness(); const engine = h.create(); await engine.switchAccount('owner-a');
  await engine.send(id(1), 'unsent fixture');
  const previousCalls = h.calls.filter((item) => item === 'network').length;
  await engine.remove(id(1));
  h.online(); await engine.retryPending();
  assert.equal(h.calls.filter((item) => item === 'network').length, previousCalls);
  assert.equal(engine.view().pendingTurns.length, 1);
  assert.equal(engine.view().conversations[0].deleted, true);
});

test('cursor pages, tombstones and 410 reset preserve pending local commands', async () => {
  const h = harness(); const engine = h.create(); await engine.switchAccount('owner-a');
  await engine.send(id(1), 'offline pending');
  let page = 0;
  h.api.changes = async (cursor) => {
    if (cursor === 0 && page++ === 0) throw new ChatApiError(410, 'CHAT_SYNC_RESET_REQUIRED');
    if (cursor === 0) return { changes: [{ kind: 'message', id: id(20), changeSeq: 1, deletedAt: null,
      conversationId: id(5), clientConversationId: null, clientMessageId: id(21), clientTurnId: id(22),
      role: 'assistant', content: 'remote answer' }], cursor: 1, hasMore: true };
    return { changes: [{ kind: 'conversation', id: id(5), changeSeq: 2, deletedAt: null,
      conversationId: null, clientConversationId: id(1), clientMessageId: null, clientTurnId: null,
      role: null, content: null }], cursor: 2, hasMore: false };
  };
  await engine.pull();
  assert.equal(engine.view().cursor, 2);
  assert.equal(engine.view().pendingTurns.length, 1);
  assert.equal(engine.view().messages.some((item) => item.content === 'remote answer'), true);
  h.api.changes = async () => ({ changes: [{ kind: 'conversation', id: id(5), changeSeq: 3,
    deletedAt: '2026-01-01T00:00:00Z', conversationId: null, clientConversationId: id(1),
    clientMessageId: null, clientTurnId: null, role: null, content: null }], cursor: 3, hasMore: false });
  await engine.pull();
  assert.equal(engine.view().conversations[0].deleted, true);
  assert.equal(engine.view().pendingTurns.length, 1);
});

test('auth source never puts token in local SQLite model or ordinary storage', () => {
  const source = readFileSync(join(__dirname, '..', 'src', 'mobile', 'auth.native.ts'), 'utf8');
  const storage = readFileSync(join(__dirname, '..', 'src', 'mobile', 'chat-storage.native.ts'), 'utf8');
  assert.match(source, /SecureStore\.setItemAsync/);
  assert.doesNotMatch(source + storage, /AsyncStorage|localStorage|console\.(log|error)/);
  assert.doesNotMatch(storage, /accessToken|refreshToken|Bearer /);
  const localIdentity = source.slice(source.indexOf('export async function mobileAccountKey'),
    source.indexOf('export async function mobileSignOut'));
  assert.match(localIdentity, /readTokens\(\)/);
  assert.match(localIdentity, /checkToken\(stored\.accessToken, false\)/);
  assert.doesNotMatch(localIdentity, /mobileAccessToken\(\)/);
});
