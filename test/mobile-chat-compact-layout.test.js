const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const chat = read('src/components/mobile-chat.native.tsx');
const header = read('src/components/app-header.native.tsx');
const shell = read('src/components/app-shell.native.tsx');

test('native Chat uses one compact action header without body auth or numbered conversation controls', () => {
  assert.match(chat, /onBack=\{\(\) => router\.canGoBack\(\)/);
  assert.match(chat, /onHistory=\{account \?/);
  assert.match(chat, /onNewChat=\{account \?/);
  assert.match(header, /accessibilityLabel="Буцах"/);
  assert.match(header, /accessibilityLabel="Ярианы түүх"/);
  assert.match(header, /accessibilityLabel="Шинэ чат"/);
  assert.match(header, /iconButton: \{ width: 44, height: 44/);
  assert.match(header, /language: \{ minWidth: 44, height: 44/);
  assert.doesNotMatch(header, /settings|тохиргоо|⚙/i);
  assert.doesNotMatch(chat, /styles\.title|styles\.tabs|styles\.signOut|>Гарах</);
  assert.doesNotMatch(chat, /\{index \+ 1\}\{item\.id === conversation/);
});

test('message viewport and compact composer preserve keyboard and safe-area layout contracts', () => {
  assert.match(chat, /KeyboardAvoidingView[\s\S]*behavior=\{Platform\.OS === 'ios' \? 'padding'/);
  assert.match(chat, /layout: \{ flex: 1, minHeight: 0/);
  assert.match(chat, /messages: \{ flex: 1, minHeight: 0/);
  assert.match(chat, /composer: \{ flexShrink: 0/);
  assert.match(chat, /maxHeight: 92/);
  assert.match(chat, /accessibilityLabel="Дуу оруулах \(удахгүй\)" disabled/);
  assert.match(chat, />🎤<\/Text>/);
  assert.match(chat, /sendButton: \{ width: 48, height: 48/);
  assert.match(chat, /accessibilityLabel=\{t\('chat\.send'\)\}/);
  assert.match(chat, /placeholderTextColor="#627D98"/);
  assert.match(shell, /keyboardDidShow/);
  assert.match(shell, /!keyboardVisible && <NativeBottomNavigation/);
});

test('pending, retry, error and history remain compact and data-backed', () => {
  assert.match(chat, /message\.status === 'failed' \? 'Илгээгдээгүй · Дахин оролдох'/);
  assert.match(chat, /onPress=\{\(\) => void retry\(\)\}/);
  assert.match(chat, /accessibilityLiveRegion="polite" numberOfLines=\{2\}/);
  assert.match(chat, /accessibilityLabel="Chat-ийг дахин ачаалах"/);
  assert.match(chat, /messages: \{ flex: 1, minHeight: 0, backgroundColor: '#FFFFFF' \}/);
  assert.match(chat, /state\.conversations\.filter\(\(item\) => !item\.deleted\)/);
  assert.match(chat, /conversationTitle\(item\.id, index\)/);
  assert.match(chat, /await engine\.current\?\.retryPending\(\)/);
  assert.match(chat, /await engine\.current\?\.retryDeletes\(\)/);
});
