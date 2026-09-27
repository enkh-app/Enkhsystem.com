const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

function loadAdminApi() {
  const source = readFileSync(join(__dirname, '..', 'src', 'mobile', 'admin-api.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'require', 'module', code)(module.exports, require, module);
  return module.exports;
}
const { createMobileAdminApi, MobileAdminApiError, mobileAdminAccessAllowed } = loadAdminApi();
const userId = '11111111-1111-4111-8111-111111111111';

test('native admin API is fixed to production and carries bearer only on bounded requests', async () => {
  const calls = [];
  const api = createMobileAdminApi(async () => 'fixture-token', async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ success: true, data: { readOnly: true,
      database: { status: 'connected' }, accounts: { withWorkspace: 1 },
      workspaces: { records: 1, bytes: 10, updated24h: 0 },
      reminders: { total: 0, scheduled: 0, processing: 0, delivered: 0, failed: 0, cancelled: 0 },
      activity: { messengerActiveMessages: 0, messengerMessages24h: 0, workspacesUpdated24h: 0 } } }) };
  });
  await api.overview();
  assert.equal(calls[0].url, 'https://api.enkhsystems.com/api/admin/overview');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-token');
});

test('normal mobile user 403 is preserved as a safe admin error', async () => {
  const api = createMobileAdminApi(async () => 'normal-user-token', async () => ({ ok: false, status: 403,
    json: async () => ({ success: false, error: { code: 'ADMIN_REQUIRED' } }) }));
  await assert.rejects(api.overview(), (error) => error instanceof MobileAdminApiError &&
    error.status === 403 && error.code === 'ADMIN_REQUIRED');
});

test('admin access probe is fail closed and can refresh immediately after sign-in', async () => {
  assert.equal(await mobileAdminAccessAllowed({ overview: async () => ({ readOnly: true }) }), true);
  assert.equal(await mobileAdminAccessAllowed({ overview: async () => { throw new Error('denied'); } }), false);

  const account = readFileSync(join(__dirname, '..', 'src', 'app', 'account.native.tsx'), 'utf8');
  const signInBody = account.slice(account.indexOf('const signIn = async'), account.indexOf('const signOut = async'));
  assert.match(signInBody, /mobileSignIn\(\)/);
  assert.match(signInBody, /setShowAdmin\(await mobileAdminAccessAllowed\(adminApi\)\)/);
});

test('admin responses and user identifiers fail closed when malformed', async () => {
  const api = createMobileAdminApi(async () => 'token', async () => ({ ok: true,
    json: async () => ({ success: true, users: [{ id: userId, displayName: 'Admin', email: 'a@example.test',
      status: 'active', createdAt: null, lastActivityAt: null }] }) }));
  await assert.rejects(api.users(), (error) => error instanceof MobileAdminApiError && error.status === 502);
  await assert.rejects(api.user('not-a-uuid'), (error) => error instanceof MobileAdminApiError && error.status === 404);
});

test('Account exposes Admin only after server authorization and never guesses by email', () => {
  const account = readFileSync(join(__dirname, '..', 'src', 'app', 'account.native.tsx'), 'utf8');
  assert.match(account, /createMobileAdminApi\(mobileAccessToken\)/);
  assert.match(account, /mobileAdminAccessAllowed\(adminApi\)/);
  assert.match(account, /showAdmin \? <Pressable/);
  assert.doesNotMatch(account, /email.*admin|admin.*email/i);
  for (const file of ['index.native.tsx', 'users.native.tsx']) {
    const source = readFileSync(join(__dirname, '..', 'src', 'app', 'admin', file), 'utf8');
    assert.match(source, /mobileAccessToken/);
  }
});

test('mobile Auth requests least-privilege delegated Chat and Admin scopes explicitly', () => {
  const auth = readFileSync(join(__dirname, '..', 'src', 'mobile', 'auth.native.ts'), 'utf8');
  assert.match(auth, /MOBILE_AUTH_SCOPES\s*=\s*\['openid', 'profile', 'offline_access', 'use:chat', 'read:admin-data'\]/);
  assert.match(auth, /scopes:\s*MOBILE_AUTH_SCOPES/);
  assert.doesNotMatch(auth, /manage:page-content|write:admin|admin:\*/);
});
