const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function compile(file, customRequire = require) {
  const source = readFileSync(join(__dirname, '..', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; Function('module', 'exports', 'require', js)(module, module.exports, customRequire); return module.exports;
}
const model = compile('src/document-model.ts');
const exporter = compile('src/document-docx.ts', (id) => id === './document-model' ? model : require(id));

test('DOCX generator creates real A4 OpenXML with Unicode lists and tables', async () => {
  const document = model.validateDocumentModel({ version: 1, title: 'Монгол баримт', documentType: 'report', date: '2026-09-10', metadata: [], sections: [{ heading: 'Үндсэн хэсэг', level: 1, blocks: [{ type: 'paragraph', text: 'Сайн байна уу' }, { type: 'list', style: 'numbered', items: ['Нэгдүгээр'] }, { type: 'table', columns: ['Нэр', 'Дүн'], rows: [['Тест', '10']] }] }] });
  const output = await exporter.createDocxBlob(document); const bytes = Buffer.from(await output.blob.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString(), 'PK'); assert.equal(output.filename, 'Монгол баримт.docx');
  const JSZip = require('jszip'); const zip = await JSZip.loadAsync(bytes); const xml = await zip.file('word/document.xml').async('string');
  assert.match(xml, /Монгол баримт/); assert.match(xml, /Сайн байна уу/); assert.match(xml, /w:tbl/); assert.match(xml, /w:pgSz w:w="11906" w:h="16838"/);
  assert.doesNotMatch(xml, /OPENAI|DATABASE_URL|accountId|prompt/i);
});
