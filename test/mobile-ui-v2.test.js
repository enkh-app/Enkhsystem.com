const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const source = read('src/components/native-navigation-model.ts');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleResult = { exports: {} };
new Function('exports', 'module', code)(moduleResult.exports, moduleResult);
const { nativePrimaryRoutes, nativePrimaryRoute } = moduleResult.exports;

test('native bottom navigation has five reachable primary destinations', () => {
  assert.deepEqual(nativePrimaryRoutes.map((item) => [item.label, item.href]), [
    ['Нүүр', '/'], ['Чат', '/chat'], ['Үйлдэл', '/actions'],
    ['Мэдлэг', '/knowledge'], ['Би', '/account'],
  ]);
  for (const pathname of ['/', '/chat', '/actions', '/knowledge', '/account'])
    assert.equal(nativePrimaryRoute(pathname), pathname);
  assert.equal(nativePrimaryRoute('/tools/calculation'), '/actions');
  assert.equal(nativePrimaryRoute('/action-document'), '/actions');
  assert.equal(nativePrimaryRoute('/search'), '/knowledge');
  assert.equal(nativePrimaryRoute('/workspace'), '/account');
});

test('native shell owns safe-area bottom tabs while web shell leaves markup untouched', () => {
  const shell = read('src/components/app-shell.native.tsx');
  assert.match(shell, /NativeBottomNavigation/);
  assert.match(shell, /keyboardDidShow/);
  assert.match(shell, /keyboardDidHide/);
  assert.match(read('src/components/native-bottom-navigation.native.tsx'), /edges=\{\['bottom'\]\}/);
  assert.match(read('src/components/app-shell.web.tsx'), /return <>\{children\}<\/>/);
  assert.match(read('src/app/_layout.tsx'), /<AppShell>[\s\S]*<Stack/);
});

test('native Home is Chat-first and existing web dashboard remains selected on web', () => {
  const route = read('src/app/index.tsx');
  const native = read('src/components/mobile-home.native.tsx');
  assert.match(route, /Platform\.OS === 'web' \? <WebHomeScreen \/> : <MobileHome \/>/);
  assert.match(route, /enkhStructuredData/);
  assert.match(native, /Сайн байна уу, Nasa\./);
  assert.match(native, /router\.navigate\('\/chat'\)/);
  for (const href of ['/chat', '/actions', '/knowledge']) assert.ok(native.includes(`href: '${href}'`));
});

test('native Actions and Knowledge reuse working contracts without fabricated results', () => {
  const actions = read('src/app/actions.native.tsx');
  const knowledge = read('src/app/knowledge.native.tsx');
  for (const href of ['/tools/calculation', '/action-reminder', '/action-document'])
    assert.ok(actions.includes(`href: '${href}'`));
  assert.match(knowledge, /await searchWeb\(value\)/);
  assert.match(knowledge, /setRecent\(\(current\) => \[entry/);
  assert.match(knowledge, /catch \{ setError/);
  assert.match(read('src/app/knowledge.tsx'), /Redirect href="\/chat"/);
});

test('native Account uses mobile identity without changing web account flow or canonical iOS config', () => {
  assert.match(read('src/app/account.native.tsx'), /mobileAccountKey\(\)/);
  assert.match(read('src/app/account.tsx'), /getAuthState/);
  const config = JSON.parse(read('app.json')).expo;
  assert.equal(config.ios.bundleIdentifier, 'com.enkhsystem.enkh');
  assert.equal(config.scheme, 'enkhapp');
  assert.equal(config.extra.eas.projectId, '0a058132-e8ad-43f8-9be0-cf27937541f8');
});
