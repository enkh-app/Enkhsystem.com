const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rendererRoot = path.join(__dirname, '..', 'src', 'renderer');

test('renderer provides the mobile-parity Home, Chat, Account and five-item navigation', () => {
  const app = fs.readFileSync(path.join(rendererRoot, 'App.tsx'), 'utf8');
  const model = fs.readFileSync(path.join(rendererRoot, 'ui-model.ts'), 'utf8');
  for (const label of ['Нүүр', 'Чат', 'Үйлдэл', 'Мэдлэг', 'Би']) assert.match(model, new RegExp(label));
  for (const screen of ['home-screen', 'chat-screen', 'account-screen']) assert.match(app, new RegExp(screen));
});

test('renderer is responsive at narrow and wide desktop widths', () => {
  const css = fs.readFileSync(path.join(rendererRoot, 'styles.css'), 'utf8');
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /@media\(min-width:900px\)/);
  assert.match(css, /width:min\(100%,1060px\)/);
});

test('renderer has no Expo or React Native platform imports', () => {
  for (const name of fs.readdirSync(rendererRoot).filter((name) => /\.(ts|tsx)$/.test(name))) {
    const source = fs.readFileSync(path.join(rendererRoot, name), 'utf8');
    assert.doesNotMatch(source, /from ['"](?:expo|expo-|react-native)/);
    assert.doesNotMatch(source, /SecureStore|expo-sqlite|AuthSession|WebBrowser/);
  }
});

test('renderer CSP denies network access during local Phase 1', () => {
  const html = fs.readFileSync(path.join(rendererRoot, 'index.html'), 'utf8');
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /frame-src 'none'/);
});
