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
  let email = options.email || 'account@example.test'; let fail = options.fail; let revision = options.revision || 3;
  const api = {
    AdminApiError,
    getAuthState: async () => email ? ({ authenticated: true, admin: false, user: { email } }) : ({ authenticated: false, admin: false }),
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
    fingerprint: async (value) => `hash:${value}`, debounceMs: 10,
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
