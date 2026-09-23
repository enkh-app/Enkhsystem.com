const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { AuthGenerationGuard, MOBILE_LOGOUT_REDIRECT, mobileLogoutUrl,
  runLocalFirstSignOut, saveIfCurrent } = require('../src/mobile/auth-logout.ts');

test('logout callback is exact and arbitrary callbacks are rejected', () => {
  const url = new URL(mobileLogoutUrl('https://tenant.example.test', 'public_client_123', MOBILE_LOGOUT_REDIRECT));
  assert.equal(url.origin, 'https://tenant.example.test');
  assert.equal(url.pathname, '/v2/logout');
  assert.equal(url.searchParams.get('returnTo'), 'enkhapp://auth/logout');
  assert.throws(() => mobileLogoutUrl('https://tenant.example.test', 'public_client_123', 'https://evil.test'));
  assert.throws(() => mobileLogoutUrl('http://tenant.example.test', 'public_client_123', MOBILE_LOGOUT_REDIRECT));
});

test('local credentials are deleted before best-effort remote logout', async () => {
  const calls = [];
  const result = await runLocalFirstSignOut({
    invalidate: () => calls.push('invalidate'), readRefreshToken: async () => 'fixture-refresh-token',
    deleteCredentials: async () => calls.push('delete'), afterLocalClear: () => calls.push('clear-view'),
    revokeRefreshToken: async () => { calls.push('revoke'); throw new Error('offline'); },
    closeBrowserSession: async () => { calls.push('browser'); throw new Error('offline'); },
  });
  assert.deepEqual(calls, ['invalidate', 'delete', 'clear-view', 'revoke', 'browser']);
  assert.deepEqual(result, { localCleared: true, revoked: false, browserLoggedOut: false });
});

test('revocation succeeds when available and browser failure cannot undo local sign-out', async () => {
  const result = await runLocalFirstSignOut({
    invalidate() {}, readRefreshToken: async () => 'fixture-refresh-token', deleteCredentials: async () => {},
    revokeRefreshToken: async () => {}, closeBrowserSession: async () => { throw new Error('dismissed'); },
  });
  assert.equal(result.localCleared, true); assert.equal(result.revoked, true); assert.equal(result.browserLoggedOut, false);
});

test('generation guard invalidates in-flight sign-in and refresh saves', () => {
  const guard = new AuthGenerationGuard(); const before = guard.capture();
  assert.equal(guard.isCurrent(before), true); guard.invalidate();
  assert.equal(guard.isCurrent(before), false); assert.equal(guard.isCurrent(guard.capture()), true);
});

test('an in-flight token write is erased when sign-out wins the race', async () => {
  const guard = new AuthGenerationGuard(); const generation = guard.capture();
  let release; let erased = false;
  const blockedWrite = new Promise((resolve) => { release = resolve; });
  const saving = saveIfCurrent(guard, generation, () => blockedWrite, async () => { erased = true; });
  guard.invalidate(); release();
  await assert.rejects(saving, /MOBILE_SIGN_IN_REQUIRED/);
  assert.equal(erased, true);
});

test('Account and Chat use the shared sign-out without deleting account-scoped SQLite', () => {
  const auth = readFileSync(join(__dirname, '..', 'src', 'mobile', 'auth.native.ts'), 'utf8');
  const account = readFileSync(join(__dirname, '..', 'src', 'app', 'account.native.tsx'), 'utf8');
  const chat = readFileSync(join(__dirname, '..', 'src', 'components', 'mobile-chat.native.tsx'), 'utf8');
  const storage = readFileSync(join(__dirname, '..', 'src', 'mobile', 'chat-storage.native.ts'), 'utf8');
  assert.match(account, /mobileSignOut/); assert.match(chat, /mobileSignOut/);
  assert.match(chat, /switchAccount\(null\)/); assert.match(auth, /SecureStore\.deleteItemAsync\(TOKEN_KEY\)/);
  assert.doesNotMatch(storage, /DELETE FROM chat_account_state|DROP TABLE/);
  assert.doesNotMatch(auth + account + chat, /console\.(log|error)|error_description/);
});
