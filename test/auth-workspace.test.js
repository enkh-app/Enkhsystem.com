const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('account connects to Auth0 BFF without client secrets', () => {
  const api = read('src/api.ts'); const account = read('src/app/account.tsx');
  assert.match(api, /\/auth\/me/); assert.match(api, /credentials: 'include'/); assert.match(api, /\/auth\/login/); assert.match(api, /\/auth\/logout/);
  assert.match(account, /Нэвтрэх/); assert.match(account, /Гарах/); assert.doesNotMatch(api + account, /AUTH0_CLIENT_SECRET|SESSION_SECRET/);
});

test('cloud workspace uses explicit import and revision-protected sync', () => {
  const api = read('src/api.ts'); const screen = read('src/app/workspace.tsx');
  assert.match(api, /api\/workspace\/import/); assert.match(api, /expectedRevision/); assert.match(screen, /Local workspace import/); assert.match(screen, /Cloud руу sync/); assert.match(screen, /replaceWorkspaceSafely/);
});

test('cloud replacement preserves a local backup', () => {
  const source = read('src/workspace-store.ts');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; new Function('exports','require','module',code)(module.exports, require, module);
  const values = new Map([[module.exports.WORKSPACE_STORAGE_KEY, JSON.stringify({ version: 1, sessions: [{ id: 'local' }], entries: [] })]]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  assert.equal(module.exports.replaceWorkspaceSafely({ version: 1, sessions: [], entries: [] }, storage), true);
  assert.match(values.get(module.exports.WORKSPACE_BACKUP_KEY), /local/);
});
