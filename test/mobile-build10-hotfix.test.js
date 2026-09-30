const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

function loadTypeScript(file) {
  const source = read(file);
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const moduleRef = { exports: {} };
  new Function('exports', 'require', 'module', code)(moduleRef.exports, require, moduleRef);
  return moduleRef.exports;
}

test('mobile JWT claims decode Base64URL bytes as UTF-8 Cyrillic and repair stored mojibake', () => {
  const { decodeMobileJwtClaims, normalizeMobileDisplayName } = loadTypeScript('src/mobile/jwt-claims.ts');
  const payload = Buffer.from(JSON.stringify({ name: 'Насаа Баттулга' }), 'utf8').toString('base64url');
  const claims = decodeMobileJwtClaims(`header.${payload}.signature`);
  assert.equal(claims.name, 'Насаа Баттулга');
  const mojibake = Buffer.from('Насаа Баттулга', 'utf8').toString('latin1');
  assert.equal(normalizeMobileDisplayName(mojibake), 'Насаа Баттулга');
  assert.equal(normalizeMobileDisplayName('Nasa'), 'Nasa');
  assert.throws(() => decodeMobileJwtClaims('header.%%%25.signature'), /MOBILE_TOKEN_INVALID/);
});

test('native Chat consumes only the canonical public API URL', () => {
  const files = ['src/components/mobile-chat.native.tsx', 'src/mobile/guest-chat.native.ts'];
  for (const file of files) {
    const source = read(file);
    assert.match(source, /EXPO_PUBLIC_ENKH_API_URL/);
    assert.doesNotMatch(source, /EXPO_PUBLIC_ENKH_CHAT_API_URL/);
  }
});

test('native Home and legacy Chat route own only the compact native presentation', () => {
  const home = read('src/app/index.native.tsx');
  const chatRoute = read('src/app/chat.native.tsx');
  const compact = read('src/components/mobile-chat.native.tsx');
  for (const route of [home, chatRoute]) {
    assert.match(route, /mobile-chat\.native/);
    assert.match(route, /<MobileChatScreen homeMode \/>/);
    assert.doesNotMatch(route, /WebChatScreen|styles\.title|styles\.intro/);
  }
  assert.match(compact, /styles\.messages/);
  assert.match(compact, /styles\.composer/);
});

test('Home and Chat contain no sign-out ownership', () => {
  const sources = [
    read('src/app/index.native.tsx'), read('src/app/chat.native.tsx'),
    read('src/components/mobile-home.native.tsx'), read('src/components/mobile-chat.native.tsx'),
  ].join('\n');
  assert.doesNotMatch(sources, /mobileSignOut|signOut|Гарах/);
  assert.match(read('src/app/account.native.tsx'), /mobileSignOut/);
});
