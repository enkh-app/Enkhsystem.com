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

test('native bottom navigation has four reachable primary destinations and legacy Chat selects Home', () => {
  assert.deepEqual(nativePrimaryRoutes.map((item) => [item.label, item.href]), [
    ['Нүүр', '/'], ['Үйлдэл', '/actions'], ['Мэдлэг', '/knowledge'], ['Би', '/account'],
  ]);
  for (const pathname of ['/', '/actions', '/knowledge', '/account'])
    assert.equal(nativePrimaryRoute(pathname), pathname);
  assert.equal(nativePrimaryRoute('/chat'), '/');
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
  assert.match(native, /<MobileChatScreen homeMode \/>/);
  const chat = read('src/components/mobile-chat.native.tsx');
  assert.match(chat, /Сайн байна уу, Nasa\./);
  assert.match(chat, /new MobileChatEngine\(nativeChatPersistence/);
  assert.match(chat, /retryPending\(\)/);
  assert.match(chat, /await engine\.current\?\.send/);
  assert.doesNotMatch(native, /Дуугаар/);
  const legacy = read('src/app/chat.tsx');
  assert.match(legacy, /Platform\.OS === 'web' \? <WebChatScreen \/> : <MobileHome \/>/);
  assert.match(read('src/components/mobile-chat.tsx'), /homeMode\?: boolean/);
  assert.match(read('src/components/mobile-chat.web.tsx'), /homeMode\?: boolean/);
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
