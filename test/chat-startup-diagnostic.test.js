const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(__dirname, '../src/mobile', `${name}.ts`), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'require', 'module', code)(module.exports, id => id.startsWith('./') ? load(id.slice(2)) : require(id), module);
  cache.set(name, module.exports); return module.exports;
}
const { chatStartupDiagnostic } = load('chat-startup-diagnostic');
const { ChatApiError } = load('chat-api');
test('startup diagnostic separates SQLite failures from API and preserves bounded status/path', () => {
  assert.match(chatStartupDiagnostic('switchAccount', new Error('INVALID_LOCAL_ACCOUNT')), /status=none endpoint=none source=local_storage/);
  assert.match(chatStartupDiagnostic('pull', new ChatApiError(403, 'FORBIDDEN')), /stage=pull code=FORBIDDEN status=403 endpoint=\/api\/chat\/changes/);
  assert.match(chatStartupDiagnostic('retryPending', new ChatApiError(0, 'NETWORK_UNAVAILABLE')), /endpoint=\/api\/chat\/turns source=network_or_auth/);
});
test('startup diagnostic redacts arbitrary provider codes, messages and credentials', () => {
  const secret = 'Bearer private-token https://private.example/user';
  for (const error of [new Error(secret), new ChatApiError(401, secret)]) {
    const output = chatStartupDiagnostic('pull', error);
    assert.match(output, /code=UNCLASSIFIED/);
    assert.ok(!output.includes(secret)); assert.ok(!output.includes('private'));
  }
});
