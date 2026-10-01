const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '..', 'src/components/mobile-chat.native.tsx'), 'utf8');

test('native Home always shows Chat and delegates authentication to Account', () => {
  assert.doesNotMatch(source, /mobileSignIn|formatMobileAuthDiagnostic|void signIn\(\)/);
  assert.match(source, /if \(!account\) \{[\s\S]*Үргэлжлүүлэхийн тулд Би хэсгээс нэвтэрнэ үү\.[\s\S]*return;/);
  assert.match(source, /onHistory=\{account \?/);
  assert.match(source, /onNewChat=\{account \?/);
  assert.match(source, /<ScrollView style=\{styles\.messages\}/);
  assert.match(source, /<View style=\{styles\.composer\}>/);
  assert.match(source, /new MobileChatEngine\(nativeChatPersistence/);
  assert.match(source, /await instance\.send/);
  assert.match(source, /useFocusEffect\(useCallback/);
  assert.match(source, /next !== accountRef\.current/);
  assert.match(source, /setAccountVersion\(\(value\) => value \+ 1\)/);
  assert.match(source, /from '\.\/app-header\.native'/);
});
