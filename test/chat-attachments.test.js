const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateChatAttachment } = require('../src/mobile/chat-attachments.ts');

const candidate = (name, size = 42) => ({ localId: name, uri: 'file:///tmp/selected', name, size });

test('accepts common image and document types with canonical MIME', () => {
  assert.equal(validateChatAttachment(candidate('photo.JPG')).mimeType, 'image/jpeg');
  assert.equal(validateChatAttachment(candidate('report.pdf')).kind, 'document');
  assert.equal(validateChatAttachment(candidate('sheet.xlsx')).mimeType,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

test('rejects unsupported, unsafe, and oversized files before upload', () => {
  assert.throws(() => validateChatAttachment(candidate('backup.zip')), /UNSUPPORTED_ATTACHMENT_TYPE/);
  assert.throws(() => validateChatAttachment(candidate('../photo.png')), /INVALID_ATTACHMENT_NAME/);
  assert.throws(() => validateChatAttachment(candidate('photo.png', 10_000_001)), /ATTACHMENT_SIZE_LIMIT/);
  assert.throws(() => validateChatAttachment({ ...candidate('photo.png'), uri: 'https://outside/file' }),
    /INVALID_ATTACHMENT/);
});

test('caps count and total bytes', () => {
  const two = [validateChatAttachment(candidate('a.pdf', 10_000_000)),
    validateChatAttachment(candidate('b.pdf', 10_000_000))];
  assert.throws(() => validateChatAttachment(candidate('c.pdf'), two), /ATTACHMENT_COUNT_OR_TOTAL_LIMIT/);
  assert.throws(() => validateChatAttachment(candidate('a.pdf'), two), /INVALID_ATTACHMENT/);
});
