export const DOCUMENT_MODEL_VERSION = 1 as const;
export const MAX_DOCUMENT_CHARS = 120000;

export type DocumentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'list'; style: 'bullet' | 'numbered'; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] };
export type StructuredDocument = {
  version: typeof DOCUMENT_MODEL_VERSION;
  title: string;
  subtitle?: string;
  documentType: string;
  date: string;
  metadata: { label: string; value: string }[];
  sections: { heading: string; level: 1 | 2 | 3; blocks: DocumentBlock[] }[];
  signature?: { label?: string; name?: string; role?: string; date?: string };
  footer?: { text: string };
};

const clean = (value: unknown, limit = 10000) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const level = (value: unknown, fallback: 1 | 2 | 3 = 1): 1 | 2 | 3 => Math.min(3, Math.max(1, Number(value) || fallback)) as 1 | 2 | 3;

function normalizeBlock(value: unknown): DocumentBlock | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  if (source.type === 'paragraph') { const text = clean(source.text); return text ? { type: 'paragraph', text } : null; }
  if (source.type === 'heading') { const text = clean(source.text, 300); return text ? { type: 'heading', level: level(source.level, 2), text } : null; }
  if (source.type === 'list') {
    const items = Array.isArray(source.items) ? source.items.map((item) => clean(item, 2000)).filter(Boolean).slice(0, 100) : [];
    return items.length ? { type: 'list', style: source.style === 'numbered' ? 'numbered' : 'bullet', items } : null;
  }
  if (source.type === 'table') {
    const columns = Array.isArray(source.columns) ? source.columns.map((item) => clean(item, 300)).filter(Boolean).slice(0, 12) : [];
    const rows = Array.isArray(source.rows) ? source.rows.slice(0, 100).map((row) => Array.isArray(row) ? columns.map((_, index) => clean(row[index], 2000)) : []).filter((row) => row.length) : [];
    return columns.length && rows.length ? { type: 'table', columns, rows } : null;
  }
  return null;
}

export function validateDocumentModel(value: unknown): StructuredDocument | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const sections = Array.isArray(source.sections) ? source.sections.slice(0, 40).map((item) => {
    if (!item || typeof item !== 'object') return null;
    const section = item as Record<string, unknown>;
    const heading = clean(section.heading, 300);
    const blocks = Array.isArray(section.blocks) ? section.blocks.map(normalizeBlock).filter((block): block is DocumentBlock => Boolean(block)).slice(0, 200) : [];
    return heading || blocks.length ? { heading: heading || 'Агуулга', level: level(section.level), blocks } : null;
  }).filter((section): section is StructuredDocument['sections'][number] => Boolean(section)) : [];
  const metadata = Array.isArray(source.metadata) ? source.metadata.slice(0, 20).map((item) => {
    const entry = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return { label: clean(entry.label, 100), value: clean(entry.value, 500) };
  }).filter((item) => item.label && item.value) : [];
  const document: StructuredDocument = {
    version: DOCUMENT_MODEL_VERSION,
    title: clean(source.title, 300) || 'Баримт бичиг',
    documentType: clean(source.documentType, 50) || 'other',
    date: clean(source.date, 40) || new Date().toISOString().slice(0, 10),
    metadata,
    sections,
  };
  const subtitle = clean(source.subtitle, 500); if (subtitle) document.subtitle = subtitle;
  if (source.signature && typeof source.signature === 'object') {
    const signatureSource = source.signature as Record<string, unknown>;
    const signature = { label: clean(signatureSource.label, 100), name: clean(signatureSource.name, 200), role: clean(signatureSource.role, 200), date: clean(signatureSource.date, 40) };
    if (Object.values(signature).some(Boolean)) document.signature = signature;
  }
  if (source.footer && typeof source.footer === 'object') { const footer = clean((source.footer as Record<string, unknown>).text, 500); if (footer) document.footer = { text: footer }; }
  return sections.length && JSON.stringify(document).length <= MAX_DOCUMENT_CHARS ? document : null;
}

export function documentFromEditableText(content: string, defaults: { title?: string; documentType?: string } = {}): StructuredDocument | null {
  const source = clean(content, MAX_DOCUMENT_CHARS);
  if (!source) return null;
  const lines = source.split(/\r?\n/); const sections: StructuredDocument['sections'] = [];
  let title = clean(defaults.title, 300); let titleConsumed = false; let section = { heading: 'Агуулга', level: 1 as 1 | 2 | 3, blocks: [] as DocumentBlock[] }; let paragraph: string[] = [];
  const flushParagraph = () => { if (paragraph.length) section.blocks.push({ type: 'paragraph', text: paragraph.join(' ') }); paragraph = []; };
  const flushSection = () => { if (section.blocks.length || section.heading !== 'Агуулга') sections.push(section); };
  for (let i = 0; i < lines.length; i += 1) {
    const lineText = lines[i].trim(); const heading = lineText.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); if (!titleConsumed && heading[1].length === 1 && sections.length === 0 && section.blocks.length === 0 && section.heading === 'Агуулга') { title = heading[2].trim(); titleConsumed = true; continue; }
      flushSection(); section = { heading: heading[2].trim(), level: level(heading[1].length), blocks: [] }; continue;
    }
    const table = lineText.match(/^\|(.+)\|$/);
    if (table && i + 1 < lines.length && /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[i + 1].trim())) {
      flushParagraph(); const columns = table[1].split('|').map((item) => item.trim()).filter(Boolean); const rows: string[][] = []; i += 2;
      while (i < lines.length) { const row = lines[i].trim().match(/^\|(.+)\|$/); if (!row) { i -= 1; break; } rows.push(columns.map((_, index) => clean(row[1].split('|')[index], 2000))); i += 1; }
      if (columns.length && rows.length) section.blocks.push({ type: 'table', columns: columns.slice(0, 12), rows: rows.slice(0, 100) }); continue;
    }
    const bullet = lineText.match(/^[-*]\s+(.+)$/); const numbered = lineText.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph(); const style = bullet ? 'bullet' : 'numbered'; const items: string[] = [];
      while (i < lines.length) { const match = lines[i].trim().match(style === 'bullet' ? /^[-*]\s+(.+)$/ : /^\d+[.)]\s+(.+)$/); if (!match) { i -= 1; break; } items.push(match[1].trim()); i += 1; }
      section.blocks.push({ type: 'list', style, items }); continue;
    }
    if (!lineText) flushParagraph(); else paragraph.push(lineText);
  }
  flushParagraph(); flushSection();
  return validateDocumentModel({ version: 1, title: title || 'Баримт бичиг', documentType: defaults.documentType || 'other', date: new Date().toISOString().slice(0, 10), metadata: [], sections: sections.length ? sections : [{ heading: 'Агуулга', level: 1, blocks: [{ type: 'paragraph', text: source }] }] });
}

export function documentAfterEdit(content: string, existing: StructuredDocument | null, defaults: { title?: string; documentType?: string } = {}): StructuredDocument | null {
  const edited = documentFromEditableText(content, { title: existing?.title || defaults.title, documentType: existing?.documentType || defaults.documentType });
  if (!edited || !existing) return edited;
  return validateDocumentModel({ ...edited, date: existing.date, metadata: existing.metadata, signature: existing.signature, footer: existing.footer });
}

export function modelToEditableText(document: StructuredDocument): string {
  const parts: string[] = [`# ${document.title}`];
  if (document.subtitle) parts.push(document.subtitle);
  document.sections.forEach((section) => {
    const sectionParts: string[] = [`${'#'.repeat(section.level)} ${section.heading}`];
    section.blocks.forEach((block) => {
      if (block.type === 'paragraph') sectionParts.push(block.text);
      else if (block.type === 'heading') sectionParts.push(`${'#'.repeat(block.level)} ${block.text}`);
      else if (block.type === 'list') sectionParts.push(block.items.map((item, index) => block.style === 'numbered' ? `${index + 1}. ${item}` : `- ${item}`).join('\n'));
      else sectionParts.push([`| ${block.columns.join(' | ')} |`, `| ${block.columns.map(() => '---').join(' | ')} |`, ...block.rows.map((row) => `| ${row.join(' | ')} |`)].join('\n'));
    });
    parts.push(sectionParts.filter(Boolean).join('\n\n'));
  });
  return parts.filter(Boolean).join('\n\n');
}

export function documentFromResult(result: unknown, content = ''): StructuredDocument | null {
  const source = result && typeof result === 'object' ? result as Record<string, unknown> : {};
  return validateDocumentModel(source.document) || documentFromEditableText(clean(source.content) || content, { title: clean(source.title), documentType: clean(source.documentType) });
}

export function sanitizeDocxFilename(value: string): string {
  const cleaned = value.normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\.{2,}/g, '.').replace(/\s+/g, ' ').replace(/^[. ]+|[. ]+$/g, '').trim().slice(0, 80);
  return `${cleaned || 'ENKH document'}.docx`;
}
