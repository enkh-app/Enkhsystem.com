const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('shared ENKH shell provides desktop navigation and a mobile adaptation', () => {
  const header = read('src/components/app-header.tsx');
  const css = read('src/global.css');
  assert.doesNotMatch(header, /useWindowDimensions|typeof window|innerWidth|matchMedia/);
  assert.match(header, /enkh-header/);
  assert.match(header, /enkh-mobile-controls/);
  assert.match(header, /enkh-desktop-footer/);
  assert.match(css, /@media \(min-width: 960px\)/);
  assert.match(css, /padding-left: 244px/);
});

test('static export renders one deterministic navigation tree before CSS breakpoints apply', () => {
  const header = read('src/components/app-header.tsx');
  assert.doesNotMatch(header, /desktop\s*\?|&&\s*<View/);
  assert.match(header, /primary\.map\(link\)/);
  assert.match(header, /utility\.map\(link\)/);
});

test('navigation remains accessible and account is separated from primary links', () => {
  const header = read('src/components/app-header.tsx');
  assert.match(header, /accessibilityLabel="Үндсэн цэс"/);
  assert.match(header, /accessibilityState=\{\{ selected \}\}/);
  assert.match(header, /const utility = \[/);
  assert.match(header, /href: '\/account'/);
  assert.match(header, /minHeight: 44/);
});

test('home dashboard uses only real workspace, auth and sync state', () => {
  const home = read('src/app/index.tsx');
  assert.match(home, /loadWorkspace\(\)/);
  assert.match(home, /getAuthState\(\)/);
  assert.match(home, /backgroundWorkspaceSync\.getSnapshot\(\)/);
  assert.match(home, /workspaceSyncLabel\(sync\.phase\)/);
  assert.doesNotMatch(home, /fake|mock metric|demo session/i);
});

test('home visual target includes prompt, examples, five capabilities and honest empty state', () => {
  const home = read('src/app/index.tsx');
  for (const label of ['Chat', 'Search', 'Calculation', 'Workspace', 'Tools']) assert.match(home, new RegExp(`title="${label}"`));
  assert.match(home, /enkh-mountain-hero\.png/);
  assert.match(home, /examples\.map/);
  assert.match(home, /Workspace хоосон байна/);
  assert.match(home, /accessibilityRole="header"/);
});

test('global styles prevent horizontal page overflow and preserve focus visibility', () => {
  const css = read('src/global.css');
  assert.match(css, /overflow-x: hidden/);
  assert.match(css, /focus-visible/);
  assert.match(css, /outline: 3px solid/);
});
