const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('text, message and document routes use the real drafting tool', () => {
  const dynamic = read('src/app/action/[id].tsx');
  assert.match(dynamic, /DraftingTool/);
  for (const file of ['src/app/action-message.tsx','src/app/action-document.tsx','src/app/action-text.tsx']) assert.match(read(file), /DraftingTool/);
});

test('drafting UI has validation, loading, retry, editable copy and safe message behavior', () => {
  const source = read('src/components/drafting-tool.tsx');
  assert.match(source, /ActivityIndicator/); assert.match(source, /Дахин оролдох/);
  assert.match(source, /Засварлах ноорог/); assert.match(source, /clipboard\.writeText/);
  assert.match(source, /Автоматаар илгээгдээгүй/); assert.match(source, /backgroundWorkspaceSync\.schedule/);
  assert.match(source, /Workspace-д хадгалж чадсангүй/);
  assert.ok(source.indexOf('saveWorkspace(next)') < source.indexOf('backgroundWorkspaceSync.schedule(next)'));
});

test('tools advertise only real drafting capabilities and reminder remains honest', () => {
  const tools = read('src/app/actions.tsx');
  for (const label of ['Текст боловсруулах','Мессеж бэлтгэх','Баримт бичиг']) assert.match(tools, new RegExp(label));
  assert.match(tools, /Сануулагч — durable scheduler\/notification шаардлагатай/);
  assert.match(read('src/app/action-reminder.tsx'), /durable scheduler/);
  assert.doesNotMatch(read('src/action-engine.ts'), /Мессеж илгээх/);
});
