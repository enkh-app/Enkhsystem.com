export type ChatAttachmentKind = 'image' | 'document';
export type ChatAttachment = {
  localId: string;
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  kind: ChatAttachmentKind;
};

export const MAX_CHAT_ATTACHMENT_BYTES = 10_000_000;
export const MAX_CHAT_ATTACHMENTS = 3;
export const MAX_CHAT_ATTACHMENTS_TOTAL_BYTES = 20_000_000;

const formats: Record<string, { mimeType: string; kind: ChatAttachmentKind }> = {
  jpg: { mimeType: 'image/jpeg', kind: 'image' }, jpeg: { mimeType: 'image/jpeg', kind: 'image' },
  png: { mimeType: 'image/png', kind: 'image' }, webp: { mimeType: 'image/webp', kind: 'image' },
  gif: { mimeType: 'image/gif', kind: 'image' },
  pdf: { mimeType: 'application/pdf', kind: 'document' },
  txt: { mimeType: 'text/plain', kind: 'document' }, md: { mimeType: 'text/markdown', kind: 'document' },
  json: { mimeType: 'application/json', kind: 'document' },
  csv: { mimeType: 'text/csv', kind: 'document' },
  html: { mimeType: 'text/html', kind: 'document' }, xml: { mimeType: 'application/xml', kind: 'document' },
  doc: { mimeType: 'application/msword', kind: 'document' },
  docx: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', kind: 'document' },
  rtf: { mimeType: 'application/rtf', kind: 'document' },
  odt: { mimeType: 'application/vnd.oasis.opendocument.text', kind: 'document' },
  ppt: { mimeType: 'application/vnd.ms-powerpoint', kind: 'document' },
  pptx: { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', kind: 'document' },
  xls: { mimeType: 'application/vnd.ms-excel', kind: 'document' },
  xlsx: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', kind: 'document' },
  js: { mimeType: 'text/javascript', kind: 'document' },
  ts: { mimeType: 'text/plain', kind: 'document' },
  py: { mimeType: 'text/x-python', kind: 'document' },
};

export type AttachmentCandidate = { localId: string; uri: string; name: string; size: number };

export function validateChatAttachment(candidate: AttachmentCandidate, existing: ChatAttachment[] = []): ChatAttachment {
  if (!candidate.uri || !/^(file|content):\/\//.test(candidate.uri) ||
    !candidate.localId || existing.some((item) => item.localId === candidate.localId))
    throw new Error('INVALID_ATTACHMENT');
  const name = candidate.name.trim();
  if (!name || name.length > 180 || /[\x00-\x1f\/\\]/.test(name)) throw new Error('INVALID_ATTACHMENT_NAME');
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  const format = formats[extension];
  if (!format) throw new Error('UNSUPPORTED_ATTACHMENT_TYPE');
  if (!Number.isSafeInteger(candidate.size) || candidate.size <= 0 || candidate.size > MAX_CHAT_ATTACHMENT_BYTES)
    throw new Error('ATTACHMENT_SIZE_LIMIT');
  if (existing.length >= MAX_CHAT_ATTACHMENTS ||
    existing.reduce((sum, item) => sum + item.size, candidate.size) > MAX_CHAT_ATTACHMENTS_TOTAL_BYTES)
    throw new Error('ATTACHMENT_COUNT_OR_TOTAL_LIMIT');
  return { ...candidate, name, mimeType: format.mimeType, kind: format.kind };
}
