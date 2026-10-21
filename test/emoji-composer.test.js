const { test } = require('node:test');
const assert = require('node:assert/strict');
const { appendQuickEmoji, quickEmojis } = require('../src/mobile/emoji-composer.ts');

test('quick emoji adds to editable drafts without splitting a multi-code-unit emoji at the limit', () => {
  assert.equal(appendQuickEmoji('Сайн уу ', '😊', 20), 'Сайн уу 😊');
  assert.equal(appendQuickEmoji('a'.repeat(3999), '😊', 4000), 'a'.repeat(3999));
  assert.equal(appendQuickEmoji('a'.repeat(3998), '😊', 4000), 'a'.repeat(3998) + '😊');
  assert.equal(appendQuickEmoji('сайн', '<script>', 4000), 'сайн');
  assert.equal(new Set(quickEmojis).size, quickEmojis.length);
});
