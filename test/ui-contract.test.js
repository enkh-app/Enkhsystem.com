const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('production API URL is public and development fallback remains local', () => {
  const api = read('src/api.ts');
  assert.match(api, /https:\/\/api\.enkhsystems\.com/);
  assert.match(api, /http:\/\/localhost:3000/);
  assert.match(api, /__DEV__/);
});

test('core UI uses the three live backend actions', () => {
  const api = read('src/api.ts');
  const actions = read('src/app/actions.tsx');
  assert.match(api, /runAction\('knowledge'/);
  assert.match(api, /runAction\('search'/);
  assert.match(actions, /tools\/calculation/);
  assert.match(actions, /Тун удахгүй/);
});

test('updated core screens contain no common UTF-8 mojibake markers', () => {
  const files = [
    'src/app/index.tsx',
    'src/app/chat.tsx',
    'src/app/knowledge-search.tsx',
    'src/app/actions.tsx',
    'src/app/action-message.tsx',
    'src/app/action-reminder.tsx',
  ];
  const combined = files.map(read).join('\n');
  assert.doesNotMatch(combined, /Ð|Ñ|Â|â€|ðŸ|â†|âš/);
});

test('workspace persistence never stores frontend secrets', () => {
  const storage = read('src/workspace-store.ts');
  assert.doesNotMatch(storage, /OPENAI_API_KEY|CLOUDFLARE.*TOKEN|sk-[A-Za-z0-9_-]{20,}/);
  assert.match(storage, /WORKSPACE_SCHEMA_VERSION/);
});
