const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

function loadApi(fetchImpl) {
  const code = ts.transpileModule(read('src/api.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const previousFetch = global.fetch;
  const previousDev = global.__DEV__;
  global.fetch = fetchImpl;
  global.__DEV__ = false;
  new Function('exports', 'require', 'module', '__filename', '__dirname', code)(module.exports, require, module, 'api.ts', __dirname);
  return { api: module.exports, restore: () => { global.fetch = previousFetch; global.__DEV__ = previousDev; } };
}

test('admin dashboard uses only the ENKH backend with credentialed requests', async () => {
  let url;
  let options;
  const loaded = loadApi(async (requestUrl, requestOptions) => {
    url = requestUrl; options = requestOptions;
    return { ok: true, json: async () => ({ success: true, data: { overview: {} } }) };
  });
  try {
    await loaded.api.getAdminDashboard();
    assert.equal(url, 'https://api.enkhsystems.com/api/admin/data');
    assert.equal(options.credentials, 'include');
    assert.equal(JSON.stringify(options).includes('X-Enkh-Admin-Key'), false);
  } finally { loaded.restore(); }
});

test('client source contains no n8n endpoint, admin key, raw messages, session IDs or PSIDs', () => {
  const client = [read('src/api.ts'), read('src/app/admin/data.tsx')].join('\n');
  assert.doesNotMatch(client, /app\.n8n\.cloud|ENKH_N8N_ADMIN_KEY|X-Enkh-Admin-Key|Facebook PSID/i);
  assert.doesNotMatch(read('src/app/admin/data.tsx'), /raw_messages|session_id|psid/i);
});

test('admin dashboard includes loading, auth, forbidden, error and empty states', () => {
  const screen = read('src/app/admin/data.tsx');
  assert.match(screen, /Dashboard ачаалж байна/);
  assert.match(screen, /Нэвтрэх шаардлагатай/);
  assert.match(screen, /Админ эрх шаардлагатай/);
  assert.match(screen, /Dashboard мэдээлэл авах боломжгүй/);
  assert.match(screen, /Мэдээлэл алга/);
});
