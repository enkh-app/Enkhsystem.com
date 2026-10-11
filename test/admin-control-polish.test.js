const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(name) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/admin', name+'.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'require', 'module', code)(module.exports, require, module);
  return module.exports;
}
test('missing evidence never becomes stale; expiry requires prior evidence and server expiry', () => {
  const { platformAvailability: status } = load('control-status');
  const now = Date.parse('2026-10-10T12:00:00Z');
  assert.equal(status(undefined,now),'unknown');
  assert.equal(status({evidence:'unknown',updatedAt:'2020-01-01',evidenceExpiresAt:'2020-02-01'},now),'unknown');
  assert.equal(status({evidence:'observed',updatedAt:'2020-01-01'},now),'known');
  assert.equal(status({evidence:'observed',updatedAt:'2020-01-01',evidenceExpiresAt:'2020-02-01'},now),'stale');
  assert.equal(status({evidence:'observed',updatedAt:'invalid',evidenceExpiresAt:'2020-02-01'},now),'known');
});
test('new copy has exact MN/EN/ZH parity', () => {
  const {controlCopy} = load('control-copy');
  for (const lang of ['en','zh']) assert.deepEqual(Object.keys(controlCopy[lang]),Object.keys(controlCopy.mn));
  for (const lang of ['mn','en','zh']) assert.equal(controlCopy[lang].legend.length,4);
});
test('legend is four distinct rows and desktop-only badge alignment preserves mobile layout', () => {
  const overview = fs.readFileSync(path.join(__dirname,'../src/components/admin-control-overview.tsx'),'utf8');
  const card = fs.readFileSync(path.join(__dirname,'../src/components/admin-platform-card.tsx'),'utf8');
  assert.match(overview,/copy.legend.map/);
  assert.match(card,/width >= 1024/);
  assert.match(card,/desktop && s.desktopTop/);
  assert.match(card,/desktopTitle:\{minHeight:48,lineHeight:24\}/);
  assert.match(card,/top:\{flexDirection:'row',flexWrap:'wrap'/);
});
test('hierarchy and evidence point to actual fields, not fake health or timestamps', () => {
  const source = fs.readFileSync(path.join(__dirname,'../src/components/admin-control-overview.tsx'),'utf8');
  const positions = ['copy.summary',"t('control.platforms')","t('control.systems')",'copy.management',"t('control.releaseHistory')"].map(s=>source.indexOf(s));
  assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
  assert.match(source,/overview\?\.database\?\.status/);
  assert.match(source,/Number.isFinite\(overview.reminders.total\)/);
  assert.doesNotMatch(source,/Date.now|new Date|Healthy|Online/);
});
