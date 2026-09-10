const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '..', 'src', 'workspace-store.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const store = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', code)(store.exports, require, store, 'workspace-store.ts', __dirname);

function memoryStorage(initial) {
  const values = new Map(initial ? [[store.exports.WORKSPACE_STORAGE_KEY, initial]] : []);
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('create session, deterministic title, save and reload persistence', () => {
  const storage = memoryStorage();
  const created = store.exports.createSession(store.exports.emptyWorkspace(), 'chat', '  Миний   анхны урт асуулт  ');
  assert.equal(created.session.title, 'Миний анхны урт асуулт');
  assert.equal(store.exports.saveWorkspace(created.state, storage), true);
  assert.equal(store.exports.loadWorkspace(storage).state.sessions[0].id, created.session.id);
});

test('entries persist search sources and structured action result', () => {
  let { state, session } = store.exports.createSession(store.exports.emptyWorkspace(), 'search', 'OpenAI');
  state = store.exports.addEntry(state, { sessionId: session.id, role: 'assistant', type: 'search', content: 'answer', sources: [{ title: 'OpenAI', url: 'https://openai.com' }] });
  const action = store.exports.createSession(state, 'action', '100 m² + 15%'); state = action.state;
  state = store.exports.addEntry(state, { sessionId: action.session.id, role: 'assistant', type: 'action', content: 'done', actionId: 'calculation', structuredResult: { totalValue: 115, unit: 'm²' } });
  assert.equal(store.exports.entriesFor(state, session.id)[0].sources[0].url, 'https://openai.com');
  assert.equal(store.exports.entriesFor(state, action.session.id)[0].structuredResult.totalValue, 115);
});

test('delete session removes its entries only', () => {
  let { state, session } = store.exports.createSession(store.exports.emptyWorkspace(), 'chat', 'delete me');
  state = store.exports.addEntry(state, { sessionId: session.id, role: 'user', type: 'message', content: 'hello' });
  const next = store.exports.deleteSession(state, session.id);
  assert.equal(next.sessions.length, 0); assert.equal(next.entries.length, 0);
});

test('corrupt storage recovers without throwing', () => {
  const loaded = store.exports.loadWorkspace(memoryStorage('{broken'));
  assert.equal(loaded.issue, 'corrupt'); assert.deepEqual(loaded.state.sessions, []);
});

test('storage quota failure is graceful', () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  assert.equal(store.exports.saveWorkspace(store.exports.emptyWorkspace(), storage), false);
});

test('context is truncated by count and character limits', () => {
  const entries = Array.from({ length: 20 }, (_, i) => ({ id: String(i), sessionId: 's', role: i % 2 ? 'assistant' : 'user', type: 'message', content: 'x'.repeat(1500), createdAt: new Date(i).toISOString() }));
  const context = store.exports.contextFor(entries);
  assert.ok(context.length <= store.exports.MAX_CONTEXT_MESSAGES);
  assert.ok(context.reduce((sum, item) => sum + item.content.length, 0) <= store.exports.MAX_CONTEXT_CHARS);
});

test('duplicate entry id is ignored', () => {
  const base = store.exports.emptyWorkspace();
  const entry = { id: 'same', sessionId: 's', role: 'user', type: 'message', content: 'one', createdAt: new Date().toISOString() };
  const once = store.exports.addEntry(base, entry);
  assert.equal(store.exports.addEntry(once, { ...entry, content: 'two' }).entries.length, 1);
});

test('editable draft updates its workspace entry without creating a duplicate', () => {
  let state = store.exports.emptyWorkspace();
  const created = store.exports.createSession(state, 'action', 'draft'); state = created.state;
  state = store.exports.addEntry(state, { id: 'draft-entry', sessionId: created.session.id, role: 'assistant', type: 'action', content: 'first', actionId: 'text', structuredResult: { type: 'text_draft', content: 'first' } });
  const updated = store.exports.updateEntryContent(state, 'draft-entry', 'edited');
  assert.equal(updated.entries.length, 1); assert.equal(updated.entries[0].content, 'edited'); assert.equal(updated.entries[0].structuredResult.content, 'edited');
});

test('backup inspection is read-only and reports only validated aggregate metadata', () => {
  const storage = memoryStorage();
  let state = store.exports.emptyWorkspace();
  for (const type of ['chat', 'search', 'action']) state = store.exports.createSession(state, type, type).state;
  const raw = JSON.stringify(state); storage.values.set(store.exports.WORKSPACE_BACKUP_KEY, raw);
  const before = new Map(storage.values); const summary = store.exports.inspectWorkspaceBackup(storage);
  assert.deepEqual(summary.counts, { chat: 1, search: 1, action: 1 });
  assert.equal(summary.sessionCount, 3); assert.equal(summary.schemaVersion, 1); assert.ok(summary.timestamp);
  assert.deepEqual([...storage.values], [...before]);
});

test('valid restore preserves active snapshot and original backup without cloud access', () => {
  const active = store.exports.createSession(store.exports.emptyWorkspace(), 'chat', 'active').state;
  const backup = store.exports.createSession(store.exports.emptyWorkspace(), 'action', 'backup').state;
  const storage = memoryStorage(JSON.stringify(active)); const originalBackup = JSON.stringify(backup);
  storage.values.set(store.exports.WORKSPACE_BACKUP_KEY, originalBackup);
  const restored = store.exports.restoreWorkspaceBackup(storage, new Date('2026-09-09T00:00:00.000Z'));
  assert.deepEqual(restored.state, backup);
  assert.deepEqual(JSON.parse(storage.getItem(store.exports.WORKSPACE_STORAGE_KEY)), backup);
  assert.equal(storage.getItem(store.exports.WORKSPACE_BACKUP_KEY), originalBackup);
  const snapshot = JSON.parse(storage.getItem(restored.snapshotKey));
  assert.deepEqual(snapshot.workspace, active);
});

test('malformed backup is rejected without touching current local data', () => {
  const active = store.exports.createSession(store.exports.emptyWorkspace(), 'chat', 'active').state;
  const storage = memoryStorage(JSON.stringify(active)); storage.values.set(store.exports.WORKSPACE_BACKUP_KEY, '{broken');
  const before = new Map(storage.values);
  assert.equal(store.exports.restoreWorkspaceBackup(storage), null);
  assert.deepEqual([...storage.values], [...before]);
  assert.deepEqual(store.exports.inspectWorkspaceBackup(storage), { exists: true, valid: false, sessionCount: 0, counts: { chat: 0, search: 0, action: 0 } });
});
