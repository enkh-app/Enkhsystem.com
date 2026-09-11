const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

test('public Home uses a static greeting without account identity', () => {
  const source = readFileSync(join(__dirname, '..', 'src', 'app', 'index.tsx'), 'utf8');
  assert.match(source, /t\('home\.greeting'\)/);
  assert.match(readFileSync(join(__dirname, '..', 'src', 'i18n.tsx'), 'utf8'), /'home\.greeting':'Сайн байна уу!'/);
  assert.doesNotMatch(source, /firstName|getAuthState|auth\.user|Сайн байна уу,/);
});
