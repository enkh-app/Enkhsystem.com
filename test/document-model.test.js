const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function load(file) {
  const source = readFileSync(join(__dirname, '..', file), 'utf8'); const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; Function('module', 'exports', 'require', js)(module, module.exports, require); return module.exports;
}
const model = load('src/document-model.ts');

test('canonical model validates Mongolian paragraphs lists tables and optional blocks', () => {
  const value = model.validateDocumentModel({ version: 1, title: 'Монгол тайлан', subtitle: 'Товч', documentType: 'report', date: '2026-09-10', metadata: [{ label: 'Төлөв', value: 'Бэлэн' }], sections: [{ heading: 'Агуулга', level: 1, blocks: [{ type: 'paragraph', text: 'Кирилл өгүүлбэр' }, { type: 'list', style: 'bullet', items: ['Нэг'] }, { type: 'table', columns: ['Нэр'], rows: [['Утга']] }] }], signature: { name: 'Нэр' }, footer: { text: 'Хуудасны тайлбар' } });
  assert.equal(value.title, 'Монгол тайлан'); assert.equal(value.sections[0].blocks[2].rows[0][0], 'Утга'); assert.equal(value.signature.name, 'Нэр');
});

test('editable text round-trips headings lists tables and legacy plain text', () => {
  const source = '# Тайлан\n\n## Хэсэг\n\nТайлбар\n\n1. Нэг\n2. Хоёр\n\n| Нэр | Дүн |\n| --- | --- |\n| А | 10 |';
  const value = model.documentFromEditableText(source, { documentType: 'report' });
  assert.equal(value.title, 'Тайлан'); assert.ok(value.sections[0].blocks.some((block) => block.type === 'table'));
  assert.match(model.modelToEditableText(value), /Монгол|Тайлан/);
  assert.ok(model.documentFromResult({ content: 'Legacy plain draft', documentType: 'memo' }).sections.length);
});

test('canonical editable serialization preserves contiguous list and table syntax through edit reparse', () => {
  const original = model.validateDocumentModel({ version: 1, title: 'Тайлан', documentType: 'report', date: '2026-09-10', metadata: [], sections: [{ heading: 'Үр дүн', level: 1, blocks: [{ type: 'list', style: 'numbered', items: ['Нэг', 'Хоёр'] }, { type: 'table', columns: ['Нэр', 'Төлөв'], rows: [['DOCX', 'PASS']] }] }] });
  const editable = model.modelToEditableText(original);
  assert.match(editable, /1\. Нэг\n2\. Хоёр/); assert.match(editable, /\| Нэр \| Төлөв \|\n\| --- \| --- \|\n\| DOCX \| PASS \|/);
  const reparsed = model.documentAfterEdit(editable.replace('PASS', 'Зассан'), original);
  assert.equal(reparsed.sections[0].blocks.find((block) => block.type === 'list').items.length, 2);
  assert.equal(reparsed.sections[0].blocks.find((block) => block.type === 'table').rows[0][1], 'Зассан');
});

test('editing updates canonical body while preserving safe presentation metadata', () => {
  const original = model.validateDocumentModel({ title: 'Тайлан', documentType: 'report', date: '2026-09-10', metadata: [{ label: 'Төлөв', value: 'Ноорог' }], sections: [{ heading: 'Хуучин', level: 1, blocks: [{ type: 'paragraph', text: 'Өмнөх' }] }], footer: { text: 'Footer' } });
  const edited = model.documentAfterEdit('# Тайлан\n\n# Шинэ\n\nЗассан', original);
  assert.equal(edited.sections[0].heading, 'Шинэ'); assert.equal(edited.sections[0].blocks[0].text, 'Зассан');
  assert.deepEqual(edited.metadata, original.metadata); assert.equal(edited.footer.text, 'Footer');
});

test('malformed and oversized models fail safely', () => {
  assert.equal(model.validateDocumentModel({ title: 'No sections' }), null);
  assert.equal(model.documentFromEditableText('x'.repeat(model.MAX_DOCUMENT_CHARS + 10)).sections[0].blocks[0].text.length <= model.MAX_DOCUMENT_CHARS, true);
});

test('filename sanitization blocks traversal and invalid characters while keeping Unicode', () => {
  assert.equal(model.sanitizeDocxFilename('../../Нууц:* тайлан?'), 'Нууц тайлан.docx');
  assert.equal(model.sanitizeDocxFilename('<>'), 'ENKH document.docx');
});

test('script-like content remains inert plain document text', () => {
  const value = model.documentFromEditableText('<script>alert(1)</script>');
  assert.equal(value.sections[0].blocks[0].text, '<script>alert(1)</script>');
});
