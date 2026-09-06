const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('canonical navigation is explicit and admin stays private', () => {
  const header = read('src/components/app-header.tsx');
  for (const route of ['/', '/chat', '/search', '/workspace', '/tools', '/account', '/status']) assert.ok(header.includes(`href: '${route}'`));
  assert.doesNotMatch(header, /admin\/data/);
  assert.match(header, /LOCAL WORKSPACE/);
});

test('legacy routes remain compatible without duplicate product surfaces', () => {
  assert.match(read('src/app/knowledge.tsx'), /Redirect href="\/chat"/);
  assert.match(read('src/app/explore.tsx'), /Redirect href="\/tools"/);
  assert.match(read('src/app/search.tsx'), /knowledge-search/);
  assert.match(read('src/app/tools.tsx'), /actions/);
});

test('tools expose calculation canonically and label prototypes honestly', () => {
  assert.match(read('src/app/tools/calculation.tsx'), /fixedActionId="calculation"/);
  assert.match(read('src/app/action/[id].tsx'), /actionId !== 'calculation'/);
  assert.match(read('src/components/coming-soon-action.tsx'), /ТУН УДАХГҮЙ/i);
});

test('status performs only a free health request', () => {
  assert.match(read('src/api.ts'), /ENKH_API_URL}\/health/);
  const status = read('src/app/status.tsx');
  assert.match(status, /getSystemHealth/);
  assert.doesNotMatch(status, /actions\/run|runAction/);
});

test('navigation targets remain touch-friendly and responsive', () => {
  const header = read('src/components/app-header.tsx');
  assert.match(header, /minHeight: 44/);
  assert.match(header, /flexWrap: 'wrap'/);
});
