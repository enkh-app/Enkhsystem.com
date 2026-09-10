const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = join(__dirname, '..');
const source = readFileSync(join(root, 'src', 'workspace-sync.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
class AdminApiError extends Error { constructor(status) { super(String(status)); this.status = status; } }
const empty = () => ({ version: 1, sessions: [], entries: [] });

function harness(options = {}) {
  const timers = []; const storageValues = new Map(); const calls = [];
  if (options.syncMeta) storageValues.set('enkh.workspace.sync.v1', JSON.stringify(options.syncMeta));
  let email = options.email === undefined ? 'account@example.test' : options.email; const accountId = options.accountId || ''; let fail = options.fail; let revision = options.revision || 3;
  const api = {
    AdminApiError,
    getAuthState: options.getAuthState || (async () => (email || accountId) ? ({ authenticated: true, admin: false, user: { email, accountId } }) : ({ authenticated: false, admin: false })),
    getCloudWorkspace: async () => ({ revision, workspace: options.remote || empty() }),
    syncCloudWorkspace: async (workspace, expectedRevision) => { calls.push({ workspace, expectedRevision }); if (options.syncImpl) return options.syncImpl(workspace, expectedRevision, calls.length); if (fail) throw fail; revision += 1; return { revision, workspace }; },
  };
  const module = { exports: {} };
  new Function('exports','require','module',code)(module.exports, (name) => {
    if (name === './api') return api;
    if (name === './workspace-store') return { loadWorkspace: () => ({ state: empty() }) };
    throw new Error(name);
  }, module);
  const coordinator = module.exports.createWorkspaceSyncCoordinator({
    ...api, storage: () => ({ getItem: (key) => storageValues.get(key) || null, setItem: (key, value) => storageValues.set(key, value) }),
    fingerprint: options.fingerprint || (async (value) => `hash:${value}`), debounceMs: 10,
    setTimer: (callback) => { const timer = { callback, cancelled: false }; timers.push(timer); return timer; },
    clearTimer: (timer) => { timer.cancelled = true; },
  });
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  const runLatest = async () => { await settle(); const timer = [...timers].reverse().find((item) => !item.cancelled); if (timer) { timer.cancelled = true; timer.callback(); } await settle(); await settle(); };
  return { coordinator, calls, runLatest, setFailure: (value) => { fail = value; }, setEmail: (value) => { email = value; } };
}

test('successful background sync increments revision', async () => {
  const h = harness(); const local = empty(); await h.coordinator.initialize(local);
  h.coordinator.schedule({ ...local, sessions: [{ id: 'one' }] }); await h.runLatest();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].expectedRevision, 3);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 4 });
});

test('rapid updates coalesce and use only the latest local state', async () => {
  const h = harness(); await h.coordinator.initialize(empty());
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'old' }] });
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'latest' }] }); await h.runLatest();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].workspace.sessions[0].id, 'latest');
});

test('network failure stays pending and retry succeeds', async () => {
  const h = harness({ fail: new Error('offline') }); await h.coordinator.initialize(empty());
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'safe-local' }] }); await h.runLatest();
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
  h.setFailure(null); h.coordinator.retry(); await h.runLatest();
  assert.equal(h.coordinator.getSnapshot().phase, 'synced'); assert.equal(h.calls.length, 2);
});

test('409 preserves local pending state and blocks automatic overwrite', async () => {
  const h = harness({ fail: new AdminApiError(409) }); await h.coordinator.initialize(empty());
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'unsynced-local' }] }); await h.runLatest();
  assert.equal(h.coordinator.getSnapshot().phase, 'conflict'); h.coordinator.retry(); await h.runLatest();
  assert.equal(h.calls.length, 1);
});

test('account switch cannot send the previous account pending state', async () => {
  const h = harness(); await h.coordinator.initialize(empty()); h.setEmail('other@example.test');
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'previous-account' }] }); await h.runLatest();
  assert.equal(h.calls.length, 0); assert.equal(h.coordinator.getSnapshot().phase, 'conflict');
});

test('updates remain serialized while a sync request is in flight', async () => {
  let release;
  const first = new Promise((resolve) => { release = resolve; });
  const h = harness({ syncImpl: async (workspace, _revision, call) => call === 1 ? first : ({ revision: 5, workspace }) });
  await h.coordinator.initialize(empty());
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'first' }] }); await new Promise((resolve) => setImmediate(resolve));
  await h.runLatest();
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'second' }] }); await h.runLatest();
  assert.equal(h.calls.length, 1);
  release({ revision: 4, workspace: h.calls[0].workspace });
  await new Promise((resolve) => setImmediate(resolve)); await h.runLatest();
  assert.equal(h.calls.length, 2); assert.equal(h.calls[1].workspace.sessions[0].id, 'second');
});

test('completed action paths save locally before scheduling background sync', () => {
  for (const file of ['src/app/chat.tsx','src/app/knowledge-search.tsx','src/app/action/[id].tsx']) {
    const text = readFileSync(join(root, file), 'utf8');
    const schedule = text.lastIndexOf('backgroundWorkspaceSync.schedule(next)');
    const save = Math.max(text.lastIndexOf('persist(next)', schedule), text.lastIndexOf('saveWorkspace(next)', schedule));
    assert.ok(save >= 0 && save < schedule, file);
  }
});

test('root lifecycle initializes sync before direct calculation and exposes its status', () => {
  const layout = readFileSync(join(root, 'src/app/_layout.tsx'), 'utf8');
  const calculation = readFileSync(join(root, 'src/app/action/[id].tsx'), 'utf8');
  assert.match(layout, /WorkspaceSyncBootstrap/);
  assert.match(calculation, /WorkspaceSyncStatus/);
  assert.ok(calculation.indexOf('saveWorkspace(next)') < calculation.indexOf('backgroundWorkspaceSync.schedule(next)'));
});

test('manual revision-two recovery enables the next calculation background PUT at revision two', async () => {
  const cloud = empty();
  const diverged = { ...empty(), sessions: [{ id: 'preserved-local' }] };
  const fresh = { ...diverged, sessions: [...diverged.sessions, { id: 'fresh-calculation' }] };
  const h = harness({
    revision: 1,
    remote: cloud,
    syncImpl: async (workspace, expectedRevision) => {
      assert.equal(expectedRevision, 2);
      return { revision: 3, workspace };
    },
  });
  await h.coordinator.initialize(diverged);
  assert.equal(h.coordinator.getSnapshot().phase, 'conflict');
  await h.coordinator.bind(2, diverged);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 2 });
  h.coordinator.schedule(fresh);
  await h.runLatest();
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 3 });
});

test('manual recovery binds through the opaque account ID from the real auth response shape', async () => {
  const local = { ...empty(), sessions: [{ id: 'local' }] };
  const h = harness({ email: '', accountId: 'opaque-account-fixture', revision: 1, remote: empty(), syncImpl: async (workspace, expectedRevision) => ({ revision: expectedRevision + 1, workspace }) });
  await h.coordinator.initialize(local);
  assert.equal(h.coordinator.getSnapshot().phase, 'conflict');
  await h.coordinator.bind(2, local);
  h.coordinator.schedule({ ...local, sessions: [...local.sessions, { id: 'fresh' }] });
  await h.runLatest();
  assert.equal(h.calls[0].expectedRevision, 2);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 3 });
});

test('opaque account binding does not depend on browser Web Crypto', async () => {
  const local = { ...empty(), sessions: [{ id: 'recovered' }] };
  const h = harness({ email: '', accountId: 'opaque-account-fixture', revision: 2, remote: empty(), fingerprint: async () => { throw new Error('crypto unavailable'); }, syncImpl: async (workspace, expectedRevision) => ({ revision: expectedRevision + 1, workspace }) });
  await h.coordinator.initialize(local);
  await h.coordinator.bind(3, local);
  h.coordinator.schedule({ ...local, sessions: [...local.sessions, { id: 'fresh-action' }] });
  await h.runLatest();
  assert.equal(h.calls[0].expectedRevision, 3);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 4 });
});

test('manual bind revision four survives route navigation without a redundant auth lookup', async () => {
  let authCalls = 0;
  const getAuthState = async () => {
    authCalls += 1;
    if (authCalls > 2) throw new Error('redundant auth lookup');
    return { authenticated: true, admin: false, user: { accountId: 'opaque-account-fixture', email: '' } };
  };
  const baseline = { ...empty(), sessions: [{ id: 'manual-baseline' }] };
  const h = harness({ getAuthState, revision: 3, remote: empty(), syncImpl: async (workspace, expectedRevision) => ({ revision: expectedRevision + 1, workspace }) });
  await h.coordinator.initialize(baseline);
  await h.coordinator.bind(4, baseline);
  const afterNavigation = { ...baseline, sessions: [...baseline.sessions, { id: 'calculation-after-navigation' }] };
  h.coordinator.schedule(afterNavigation);
  await h.runLatest();
  assert.equal(h.coordinator.getSnapshot().revision, 5);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].expectedRevision, 4);
  assert.equal(authCalls, 2);
});

test('transient live identity recheck preserves local state and safely retries revision five', async () => {
  let authCalls = 0;
  const getAuthState = async () => {
    authCalls += 1;
    if (authCalls === 2) throw new Error('temporary auth network failure');
    return { authenticated: true, admin: false, user: { accountId: 'opaque-account-fixture', email: '' } };
  };
  const baseline = { ...empty(), sessions: [{ id: 'revision-five-baseline' }] };
  const next = { ...baseline, sessions: [...baseline.sessions, { id: 'unsynced-calculation' }] };
  const h = harness({ getAuthState, revision: 4, remote: empty(), syncImpl: async (workspace, expectedRevision) => ({ revision: expectedRevision + 1, workspace }) });
  await h.coordinator.initialize(baseline);
  await h.coordinator.bind(5, baseline);
  h.coordinator.schedule(next);
  await h.runLatest();
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
  await h.runLatest();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].expectedRevision, 5);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 6 });
});

test('transient empty identity recheck retries revision seven and syncs only after the same account returns', async () => {
  let authCalls = 0;
  const getAuthState = async () => {
    authCalls += 1;
    if (authCalls === 2) return { authenticated: false, admin: false };
    return { authenticated: true, admin: false, user: { accountId: 'opaque-account-fixture', email: '' } };
  };
  const baseline = { ...empty(), sessions: [{ id: 'revision-seven-baseline' }] };
  const next = { ...baseline, sessions: [...baseline.sessions, { id: 'fresh-calculation' }] };
  const h = harness({ getAuthState, revision: 6, remote: empty(), syncImpl: async (workspace, expectedRevision) => ({ revision: expectedRevision + 1, workspace }) });
  await h.coordinator.initialize(baseline);
  await h.coordinator.bind(7, baseline);
  h.coordinator.schedule(next);
  await h.runLatest();
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
  await h.runLatest();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].expectedRevision, 7);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 8 });
});

test('logout during an empty-identity retry never sends the pending workspace', async () => {
  let authCalls = 0;
  const getAuthState = async () => {
    authCalls += 1;
    return authCalls === 1
      ? { authenticated: true, admin: false, user: { accountId: 'opaque-account-fixture', email: '' } }
      : { authenticated: false, admin: false };
  };
  const baseline = { ...empty(), sessions: [{ id: 'baseline' }] };
  const h = harness({ getAuthState, remote: baseline });
  await h.coordinator.initialize(baseline);
  h.coordinator.schedule({ ...baseline, sessions: [...baseline.sessions, { id: 'pending-local' }] });
  for (let index = 0; index < 8; index += 1) await h.runLatest();
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
});

test('account switch during pending identity verification is a hard conflict without PUT', async () => {
  let authCalls = 0;
  const getAuthState = async () => {
    authCalls += 1;
    const accountId = authCalls === 1 ? 'first-account-fixture' : 'second-account-fixture';
    return { authenticated: true, admin: false, user: { accountId, email: '' } };
  };
  const baseline = { ...empty(), sessions: [{ id: 'baseline' }] };
  const h = harness({ getAuthState, remote: baseline });
  await h.coordinator.initialize(baseline);
  h.coordinator.schedule({ ...baseline, sessions: [...baseline.sessions, { id: 'private-pending-local' }] });
  await h.runLatest();
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'conflict');
});

test('empty identity retry exhaustion preserves the local payload as pending', async () => {
  let authCalls = 0;
  const getAuthState = async () => {
    authCalls += 1;
    return authCalls === 1
      ? { authenticated: true, admin: false, user: { accountId: 'opaque-account-fixture', email: '' } }
      : { authenticated: false, admin: false };
  };
  const baseline = { ...empty(), sessions: [{ id: 'baseline' }] };
  const h = harness({ getAuthState, remote: baseline });
  await h.coordinator.initialize(baseline);
  h.coordinator.schedule({ ...baseline, sessions: [...baseline.sessions, { id: 'must-survive' }] });
  for (let index = 0; index < 10; index += 1) await h.runLatest();
  assert.equal(authCalls, 6);
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
});

test('cold bootstrap recovers revision seven pending local divergence after transient empty identity', async () => {
  let authCalls = 0;
  const accountId = 'opaque-account-fixture';
  const getAuthState = async () => {
    authCalls += 1;
    if (authCalls === 1) return { authenticated: false, admin: false };
    return { authenticated: true, admin: false, user: { accountId, email: '' } };
  };
  const remote = { ...empty(), sessions: [{ id: 'revision-seven-cloud' }] };
  const local = { ...remote, sessions: [...remote.sessions, { id: 'preserved-unsynced-calculation' }] };
  const h = harness({
    getAuthState,
    revision: 7,
    remote,
    syncMeta: { ownerKey: `account:${accountId}`, revision: 7 },
    syncImpl: async (workspace, expectedRevision) => ({ revision: expectedRevision + 1, workspace }),
  });
  await h.coordinator.initialize(local);
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
  assert.equal(h.calls.length, 0);
  await h.runLatest();
  assert.equal(h.calls.length, 0);
  await h.runLatest();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].expectedRevision, 7);
  assert.deepEqual(h.coordinator.getSnapshot(), { phase: 'synced', revision: 8 });
});

test('cold bootstrap never PUTs when identity remains logged out through retry exhaustion', async () => {
  const remote = { ...empty(), sessions: [{ id: 'cloud' }] };
  const local = { ...remote, sessions: [...remote.sessions, { id: 'pending-local' }] };
  const h = harness({
    getAuthState: async () => ({ authenticated: false, admin: false }),
    revision: 7,
    remote,
    syncMeta: { ownerKey: 'account:opaque-account-fixture', revision: 7 },
  });
  await h.coordinator.initialize(local);
  for (let index = 0; index < 10; index += 1) await h.runLatest();
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
});

test('cold bootstrap account mismatch remains conflict and never PUTs pending local data', async () => {
  let authCalls = 0;
  const getAuthState = async () => {
    authCalls += 1;
    if (authCalls === 1) return { authenticated: false, admin: false };
    return { authenticated: true, admin: false, user: { accountId: 'different-account-fixture', email: '' } };
  };
  const remote = { ...empty(), sessions: [{ id: 'cloud' }] };
  const local = { ...remote, sessions: [...remote.sessions, { id: 'private-pending-local' }] };
  const h = harness({
    getAuthState,
    revision: 7,
    remote,
    syncMeta: { ownerKey: 'account:original-account-fixture', revision: 7 },
  });
  await h.coordinator.initialize(local);
  await h.runLatest();
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'conflict');
});

test('restored local backup remains pending and cannot auto-sync until explicit bind', async () => {
  const h = harness(); await h.coordinator.initialize(empty());
  h.coordinator.markLocalDivergent();
  h.coordinator.schedule({ ...empty(), sessions: [{ id: 'restored-backup' }] });
  await h.runLatest();
  assert.equal(h.calls.length, 0);
  assert.equal(h.coordinator.getSnapshot().phase, 'pending');
});

test('workspace recovery UI never calls a cloud write during restore', () => {
  const screen = readFileSync(join(root, 'src/app/workspace.tsx'), 'utf8');
  const restoreBody = screen.slice(screen.indexOf('const restoreBackup'), screen.indexOf('const open'));
  assert.match(restoreBody, /restoreWorkspaceBackup/);
  assert.match(restoreBody, /markLocalDivergent/);
  assert.doesNotMatch(restoreBody, /syncCloudWorkspace|importCloudWorkspace|schedule\(/);
});
