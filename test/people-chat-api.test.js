const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/mobile/people-chat-api.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleRef = { exports: {} };
new Function('exports', 'require', 'module', code)(moduleRef.exports, require, moduleRef);
const { createPeopleChatApi } = moduleRef.exports;
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const thread = '33333333-3333-4333-8333-333333333333';
const message = '44444444-4444-4444-8444-444444444444';

test('people chat sends a bearer token only to the allowlisted API and uses a stable message ID', async () => {
  const calls = [];
  const transport = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ success: true, message: { id: message } }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  };
  const api = createPeopleChatApi(async () => 'synthetic-token', transport, 'https://api-test.enkhsystems.com');
  await api.send(thread, message, 'Сайн уу');
  assert.equal(calls[0].url, `https://api-test.enkhsystems.com/api/people-chat/threads/${thread}/messages`);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer synthetic-token');
  assert.deepEqual(JSON.parse(calls[0].init.body), { clientMessageId: message, content: 'Сайн уу' });
  assert.throws(() => createPeopleChatApi(async () => 'token', transport, 'http://localhost:3000'));
});

test('invalid contact ID and missing login never send a request', async () => {
  let calls = 0;
  const api = createPeopleChatApi(async () => '', async () => { calls++; }, 'https://api.enkhsystems.com');
  await assert.rejects(api.start('not-an-id'), /INVALID_PEOPLE_CHAT_ID/);
  await assert.rejects(api.start(bob), /MOBILE_SIGN_IN_REQUIRED/);
  assert.equal(calls, 0);
  assert.match(source, /Bearer \$\{bearer\}/);
  assert.doesNotMatch(source, /console\.(?:log|error)/);
});

test('contacts are listed, added, and removed by ID without accepting malformed responses', async () => {
  const calls = [];
  const transport = async (url, init) => {
    calls.push({ url, init });
    if (init.method === 'DELETE') return new Response(null, { status: 204 });
    const body = url.endsWith('/contacts') && init.method === 'GET'
      ? { contacts: [{ id: bob, name: 'Боб', addedAt: '2026-10-15T00:00:00Z' }] }
      : { contactId: bob };
    return new Response(JSON.stringify(body), { status: init.method === 'POST' ? 201 : 200,
      headers: { 'Content-Type': 'application/json' } });
  };
  const api = createPeopleChatApi(async () => 'synthetic-token', transport, 'https://api-test.enkhsystems.com');
  assert.equal((await api.contacts())[0].name, 'Боб');
  assert.equal(await api.addContact(bob), bob);
  await api.removeContact(bob);
  assert.deepEqual(calls.map(({ init }) => init.method), ['GET', 'POST', 'DELETE']);
  assert.equal(calls[2].url, `https://api-test.enkhsystems.com/api/people-chat/contacts/${bob}`);
  await assert.rejects(api.addContact('invalid'), /INVALID_PEOPLE_CHAT_ID/);
});
