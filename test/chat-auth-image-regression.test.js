const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function loadAuth(stored, refreshed) {
  const cache = new Map(); let refreshes = 0; let deletions = 0;
  const mocks = {
    'expo-secure-store': { isAvailableAsync: async () => true, getItemAsync: async () => stored ? JSON.stringify(stored) : null,
      setItemAsync: async (_key, value) => { stored = JSON.parse(value); }, deleteItemAsync: async () => { stored = null; deletions++; } },
    'expo-auth-session': { fetchDiscoveryAsync: async () => ({}), refreshAsync: async () => {
      refreshes++; if (refreshed instanceof Error) throw refreshed; return refreshed;
    } },
    'expo-crypto': { digestStringAsync: async () => 'a'.repeat(64), CryptoDigestAlgorithm: { SHA256: 'SHA256' } }, 'expo-web-browser': {},
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(path.join(__dirname, '../src/mobile', file + '.ts'), 'utf8');
    const module = { exports: {} }; cache.set(file, module.exports);
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    new Function('exports', 'require', 'module', code)(module.exports, id => {
      if (id === './auth-config') return { mobileAuthConfig: () => ({ issuer: 'https://auth.example', audience: 'test-api' }) };
      return id.startsWith('./') ? load(id.slice(2)) : mocks[id] || require(id);
    }, module);
    return module.exports;
  }
  return { auth: load('auth.native'), api: load('chat-api'), diagnostic: load('chat-startup-diagnostic'), parts: load('chat-image-parts'),
    refreshes: () => refreshes, deletions: () => deletions };
}
const token = (seconds, sub = 'test-user') => `e30.${Buffer.from(JSON.stringify({ iss: 'https://auth.example/', aud: 'test-api', sub, exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url')}.test`;
test('valid signed-in token without refresh is usable inside 60-second window and ignores stale cached expiry', async () => {
  const accessToken = token(30);
  const { auth } = loadAuth({ accessToken, expiresAt: 0 });
  assert.equal(await auth.mobileAccessToken(), accessToken);
});
test('expired signed-in profile without refresh fails locally before chat HTTP; real 401 stays distinct', async () => {
  const { auth, api, diagnostic } = loadAuth({ accessToken: token(-30), expiresAt: 0 });
  assert.equal((await auth.mobileProfile()).signedIn, false);
  let calls = 0;
  const client = api.createMobileChatApi(auth.mobileAccessToken, async () => { calls++; });
  await assert.rejects(client.changes(0), error => {
    assert.equal(error.message, 'MOBILE_REAUTH_REQUIRED');
    assert.match(diagnostic.chatStartupDiagnostic('pull', error), /status=none.*source=local_or_auth/);
    return true;
  });
  assert.equal(calls, 0);
  const rejected = api.createMobileChatApi(async () => 'test', async () => new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED' } }), { status: 401 }));
  await assert.rejects(rejected.changes(0), error => { assert.match(diagnostic.chatStartupDiagnostic('pull', error), /status=401.*source=api_or_auth/); return true; });
});
test('revoked refresh clears local session; offline refresh preserves credentials for retry', async () => {
  const rejected = loadAuth({ accessToken: token(-30), refreshToken: 'fixture-refresh', expiresAt: 0 },
    Object.assign(new Error('private provider details'), { code: 'invalid_grant' }));
  await assert.rejects(rejected.auth.mobileAccessToken(), /MOBILE_REAUTH_REQUIRED/);
  assert.equal(rejected.deletions(), 1);
  assert.equal((await rejected.auth.mobileProfile()).signedIn, false);

  const offline = loadAuth({ accessToken: token(-30), refreshToken: 'fixture-refresh', expiresAt: 0 },
    new Error('network unavailable'));
  await assert.rejects(offline.auth.mobileAccessToken(), /network unavailable/);
  assert.equal(offline.deletions(), 0);
  assert.equal((await offline.auth.mobileProfile()).signedIn, true);
});
test('expired token refresh succeeds; refresh cannot switch account identity', async () => {
  const fresh = token(3600);
  const good = loadAuth({ accessToken: token(-10), refreshToken: 'test-refresh', expiresAt: 0 }, { accessToken: fresh, issuedAt: Date.now() / 1000, expiresIn: 3600 });
  assert.equal(await good.auth.mobileAccessToken(), fresh); assert.equal(good.refreshes(), 1);
  const bad = loadAuth({ accessToken: token(-10), refreshToken: 'test-refresh', expiresAt: 0 }, { accessToken: token(3600, 'other-account') });
  await assert.rejects(bad.auth.mobileAccessToken(), /MOBILE_TOKEN_INVALID/);
  assert.equal(bad.deletions(), 1);
});
test('empty local token never fabricates HTTP 401 or calls transport', async () => {
  const { api, diagnostic } = loadAuth(null); let calls = 0;
  const client = api.createMobileChatApi(async () => '', async () => { calls++; });
  await assert.rejects(client.changes(0), error => {
    assert.match(diagnostic.chatStartupDiagnostic('pull', error), /code=MOBILE_SIGN_IN_REQUIRED status=none/);
    return true;
  });
  assert.equal(calls, 0);
});
test('native image load error replaces image with understandable fallback', () => {
  let failed = false;
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/native-chat-content.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const jsx = (type, props) => ({ type, props });
  new Function('exports', 'require', 'module', code)(module.exports, id => {
    if (id === 'react') return { useState: () => [failed, value => { failed = value; }] };
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (id === 'react-native') return { Image: 'Image', Text: 'Text', View: 'View', StyleSheet: { create: x => x } };
    return { chatImageParts: () => [{ kind: 'image', uri: 'https://images.example/test', alt: 'Морь' }] };
  }, module);
  const child = module.exports.NativeChatContent({ content: '' }).props.children[0];
  const image = child.type(child.props);
  assert.equal(image.type, 'Image'); image.props.onError();
  const fallback = child.type(child.props);
  assert.equal(fallback.type, 'Text'); assert.match(fallback.props.children.join(''), /Зургийг ачаалж чадсангүй/);
});
test('Markdown image preserves surrounding text; unsafe URLs become fallback, never credentials', () => {
  const { parts } = loadAuth(null);
  assert.deepEqual(parts.chatImageParts('Before ![Морьны зураг](https://images.example/horse.png) After').map(p => p.kind), ['text', 'image', 'text']);
  for (const uri of ['http://images.example/x', 'https://user:password@images.example/x', 'https://127.0.0.1/x', 'file:///x']) {
    assert.equal(parts.chatImageParts(`![image](${uri})`)[0].uri, null);
  }
});
test('retry clears diagnostics first; full bounded diagnostic accessible separately from truncated banner', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/mobile-chat.native.tsx'), 'utf8');
  const retry = source.slice(source.indexOf('const retry ='), source.indexOf('const conversations ='));
  assert.match(retry, /setNotice\(''\); setDiagnostic\(''\)/);
  assert.match(retry, /stage = 'pull'; await instance.pull\(\)/);
  assert.match(source, /Alert.alert\('Chat оношилгоо', diagnostic\)/);
  assert.match(source, /NativeChatContent content=\{message.content\}/);
});
