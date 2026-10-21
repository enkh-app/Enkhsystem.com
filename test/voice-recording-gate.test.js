const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('native recorder stays local until the transcription gate is connected', () => {
  const panel = read('src/components/voice-recording-panel.native.tsx');
  const chat = read('src/components/mobile-chat.native.tsx');
  const adapter = read('src/mobile/voice-api.ts');
  const config = JSON.parse(read('app.json'));
  assert.match(panel, /const MAX_SECONDS = 260;/);
  assert.match(panel, /const MAX_BYTES = 10_000_000;/);
  assert.match(panel, /requestRecordingPermissionsAsync\(\)/);
  assert.match(panel, /setTimeout\(\(\) => \{ void stop\(\); \}, MAX_SECONDS \* 1000\)/);
  assert.match(panel, /file\.size > MAX_BYTES/);
  assert.match(panel, /removeFile\(fileUri\.current\)/);
  assert.match(chat, /<VoiceRecordingPanel \/>/);
  assert.doesNotMatch(panel, /transcribeMobileRecording|\/api\/voice\/transcribe/);
  assert.match(adapter, /\/api\/voice\/transcribe/);
  assert.match(adapter, /mobileAccessToken\(\)/);
  assert.ok(config.expo.plugins.some(plugin => Array.isArray(plugin) && plugin[0] === 'expo-audio' &&
    plugin[1].enableBackgroundRecording === false));
});
