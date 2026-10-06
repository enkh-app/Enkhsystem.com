const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = readFileSync(join(__dirname, '..', 'src', 'mobile', `${name}.ts`), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  cache.set(name, module.exports);
  new Function('exports', 'require', 'module', code)(module.exports,
    (id) => id.startsWith('./') ? load(id.slice(2)) : require(id), module);
  return module.exports;
}
const { MobileChatEngine } = load('chat-engine');
const { createMobileChatApi } = load('chat-api');
const id = (number) => `${String(number).padStart(8, '0')}-1111-4111-8111-111111111111`;

test('image turn keeps the file URI and IDs across retry, then cleans the completed file', async () => {
  let saved = null;
  let online = false;
  let sent;
  const cleaned = [];
  const persistence = { load: async () => saved, save: async (_key, state) => { saved = structuredClone(state); } };
  const api = { turn: async () => { throw new Error('wrong transport'); },
    imageTurn: async (input) => {
      sent = input;
      if (!online) throw new Error('network down');
      return { success: true, conversationId: id(1), userMessageId: id(2), assistantMessageId: id(3),
        assistantClientMessageId: id(4), answer: 'Зурагт дээвэр байна.', duplicate: false, cursor: 3 };
    } };
  const engine = new MobileChatEngine(persistence, api, (() => { let n = 10; return () => id(n++); })(),
    undefined, async (uri) => { cleaned.push(uri); });
  await engine.switchAccount('owner');
  await engine.sendImage(id(1), 'Энэ юу вэ?', 'file:///documents/roof.jpg');
  assert.equal(saved.pendingTurns.length, 1);
  assert.equal(saved.messages[0].status, 'failed');
  const original = structuredClone(sent);
  const restarted = new MobileChatEngine(persistence, api, () => { throw new Error('new IDs'); },
    undefined, async (uri) => { cleaned.push(uri); });
  await restarted.switchAccount('owner');
  online = true;
  await restarted.retryPending();
  assert.deepEqual(sent, original);
  assert.equal(saved.pendingTurns.length, 0);
  assert.equal(saved.messages.at(-1).content, 'Зурагт дээвэр байна.');
  assert.deepEqual(cleaned, ['file:///documents/roof.jpg']);
});

test('image request uses multipart with bearer auth and validates response', async () => {
  let sent;
  const api = createMobileChatApi(async () => 'fixture', async (url, options) => {
    sent = { url, options };
    return { ok: true, json: async () => ({ success: true, conversationId: id(1),
      userMessageId: id(2), assistantMessageId: id(3), assistantClientMessageId: id(4),
      answer: 'Тайлбар', duplicate: false, cursor: 3 }) };
  });
  const input = { clientConversationId: id(1), clientTurnId: id(2), clientMessageId: id(3),
    message: 'Тайлбарла', imageUri: 'file:///documents/roof.jpg' };
  assert.equal((await api.imageTurn(input, new Blob(['image bytes']))).answer, 'Тайлбар');
  assert.equal(sent.url, 'https://api.enkhsystems.com/api/chat/turns/image');
  assert.equal(sent.options.headers.Authorization, 'Bearer fixture');
  assert.equal(sent.options.headers['Content-Type'], undefined);
  assert.equal(sent.options.body.get('clientTurnId'), id(2));
  assert.equal(sent.options.body.get('image').size, 11);
});
