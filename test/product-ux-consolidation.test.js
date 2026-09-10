const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('home quick tools reflect the four real productivity tools without duplicating chat or search', () => {
  const home = read('src/app/index.tsx');
  for (const label of ['Текст боловсруулах', 'Мессеж бэлтгэх', 'Баримт бичиг', 'Тооцоолол']) assert.match(home, new RegExp(label));
  assert.doesNotMatch(home, /Source Search|quickText}>Calculation/);
});

test('tools page groups only productive tools as active and keeps reminder honest', () => {
  const tools = read('src/app/actions.tsx');
  assert.match(tools, /Ажиллаж байгаа/); assert.match(tools, /Тун удахгүй/);
  assert.doesNotMatch(tools, /AI мэдлэг|Вэб хайлт|coming soon/i);
});

test('workspace renders metadata-aware Mongolian labels with a safe legacy fallback', () => {
  const source = read('src/workspace-store.ts');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} }; new Function('exports', 'require', 'module', code)(mod.exports, require, mod);
  let state = mod.exports.emptyWorkspace();
  for (const [id, expected] of [['calculation','Тооцоолол'],['text','Текст'],['message','Мессеж'],['document','Баримт бичиг'],['legacy','Ажил']]) {
    const created = mod.exports.createSession(state, 'action', id); state = created.state;
    state = mod.exports.addEntry(state, { sessionId: created.session.id, role: 'assistant', type: 'action', content: 'safe', actionId: id });
    assert.equal(mod.exports.workspaceSessionLabel(state, created.session), expected);
  }
});

test('cloud and backup technical metadata are secondary while safety actions remain available', () => {
  const workspace = read('src/app/workspace.tsx');
  assert.match(workspace, /workspaceSyncLabel\(sync\.phase\)/);
  assert.match(workspace, /showCloudDetails/); assert.match(workspace, /showBackupDetails/);
  assert.match(workspace, /Cloud руу sync/); assert.match(workspace, /Backup-аас сэргээх/);
  assert.match(workspace, /backgroundWorkspaceSync\.schedule/);
});

test('account and drafting screens use concise consistent user language', () => {
  const account = read('src/app/account.tsx'); const drafting = read('src/components/drafting-tool.tsx');
  assert.doesNotMatch(account, /SIGNED IN|LOCAL WORKSPACE/);
  assert.match(account, /workspaceSyncLabel/); assert.match(account, /Нэвтрэх/); assert.match(account, /Гарах/);
  assert.match(drafting, /Үүсгэж байна…/); assert.match(drafting, /Дахин үүсгэх/); assert.match(drafting, /БЭЛЭН НООРОГ/); assert.match(drafting, /Дахин оролдох/);
});

test('primary navigation is concise and public admin remains absent', () => {
  const header = read('src/components/app-header.tsx');
  for (const label of ['Нүүр','Chat','Хайлт','Workspace','Tools']) assert.match(header, new RegExp(`label: '${label}'`));
  assert.doesNotMatch(header, /\/admin|Admin/);
  assert.match(header, /minHeight: 44/);
});

test('browser timers retain their native invocation context through safe wrappers', () => {
  const sync = read('src/workspace-sync.ts');
  assert.match(sync, /setTimer: \(callback, delay\) => setTimeout\(callback, delay\)/);
  assert.match(sync, /clearTimer: \(pendingTimer\) => clearTimeout\(pendingTimer\)/);
  assert.doesNotMatch(sync, /setTimer: setTimeout|clearTimer: clearTimeout/);
});
