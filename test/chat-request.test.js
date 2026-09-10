const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadApi(fetchImpl) {
  const source = readFileSync(join(__dirname, '..', 'src', 'api.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const previousFetch = global.fetch;
  const previousDev = global.__DEV__;
  const previousHistory = global.history;
  global.fetch = fetchImpl;
  global.__DEV__ = false;
  global.history = { length: 99, sentinel: 'browser-global-must-not-be-used' };
  new Function('exports', 'require', 'module', '__filename', '__dirname', code)(module.exports, require, module, 'api.ts', __dirname);
  return { api: module.exports, restore: () => { global.fetch = previousFetch; global.__DEV__ = previousDev; global.history = previousHistory; } };
}

test('multi-turn chat sends the intended history, never browser global history', async () => {
  let requestBody;
  const loaded = loadApi(async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ success: true, message: 'ok', data: { result: { answer: 'answer' } } }) };
  });
  try {
    const history = [{ role: 'user', content: 'өмнөх асуулт' }, { role: 'assistant', content: 'өмнөх хариулт' }];
    await loaded.api.sendMessage('үргэлжлүүл', history);
    assert.deepEqual(requestBody, { actionId: 'knowledge', input: { message: 'үргэлжлүүл', history } });
    assert.equal(JSON.stringify(requestBody).includes('browser-global-must-not-be-used'), false);
  } finally { loaded.restore(); }
});

test('empty chat history preserves the legacy knowledge string contract', async () => {
  let requestBody;
  const loaded = loadApi(async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ success: true, message: 'ok', data: { result: { answer: 'answer' } } }) };
  });
  try {
    await loaded.api.sendMessage('legacy input');
    assert.deepEqual(requestBody, { actionId: 'knowledge', input: 'legacy input' });
  } finally { loaded.restore(); }
});

test('retry keeps the saved user entry and does not append it twice', () => {
  const chat = readFileSync(join(__dirname, '..', 'src', 'app', 'chat.tsx'), 'utf8');
  assert.match(chat, /if \(!retry\) next = addEntry/);
  assert.match(chat, /send\(failedText, true\)/);
  assert.match(chat, /Таны асуулт history-д хадгалагдсан/);
});

test('web chat sends on Enter while preserving Shift+Enter for a new line', () => {
  const chat = readFileSync(join(__dirname, '..', 'src', 'app', 'chat.tsx'), 'utf8');
  assert.match(chat, /Platform\.OS === 'web'/);
  assert.match(chat, /nativeEvent\.key === 'Enter'/);
  assert.match(chat, /shiftKey/);
  assert.match(chat, /event\.preventDefault\(\)/);
  assert.match(chat, /void send\(\)/);
});
