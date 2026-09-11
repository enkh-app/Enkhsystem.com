const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('language dictionaries are centralized and expose three supported locales', () => {
  const source = read('src/i18n.tsx');
  assert.match(source, /UiLanguage = 'mn' \| 'en' \| 'zh'/);
  assert.match(source, /dictionaries.*mn, en, zh/);
  assert.match(source, /enkh\.ui\.language\.v1/);
  assert.match(source, /useState<UiLanguage>\('mn'\)/);
});

test('persisted language is restored after initial render to prevent hydration mismatch', () => {
  const source = read('src/i18n.tsx');
  assert.ok(source.indexOf("useState<UiLanguage>('mn')") < source.indexOf('localStorage?.getItem'));
  assert.match(source, /useEffect\(\(\)=>/);
  assert.doesNotMatch(source, /navigator\.language|window\.location/);
});

test('shell and required product surfaces consume stable translation keys', () => {
  for (const file of ['src/components/app-header.tsx','src/app/index.tsx','src/app/chat.tsx','src/app/knowledge-search.tsx','src/app/workspace.tsx','src/app/actions.tsx','src/app/account.tsx','src/app/status.tsx','src/app/action-reminder.tsx','src/components/drafting-tool.tsx']) {
    assert.match(read(file), /useI18n/);
  }
  assert.doesNotMatch(read('src/workspace-store.ts'), /useI18n|dictionaries/);
});

test('language controls are touch friendly and do not introduce locale URLs', () => {
  const header = read('src/components/app-header.tsx');
  assert.match(header, /languageOptions\.map/);
  assert.match(header, /minHeight:44|minHeight: 44/);
  assert.doesNotMatch(header, /\/mn\/|\/en\/|\/zh\//);
});

test('required English and Chinese UI keys are explicitly translated', () => {
  const source = read('src/i18n.tsx');
  const keys = (block) => new Set([...block.matchAll(/'([^']+)'\s*:/g)].map((match) => match[1]));
  const required = keys(source.match(/const mn = \{([\s\S]*?)\} as const/)[1]);
  const english = keys(source.match(/Object\.assign\(en, \{([\s\S]*?)\}\);/)[1]);
  const chinese = keys(source.match(/Object\.assign\(zh, \{([\s\S]*?)\}\);/)[1]);
  assert.deepEqual([...required].filter((key) => !english.has(key)), [], 'English dictionary is incomplete');
  assert.deepEqual([...required].filter((key) => !chinese.has(key)), [], 'Chinese dictionary is incomplete');
});

test('known Home and drafting labels are not hard-coded in rendered source', () => {
  const rendered = [read('src/app/index.tsx'), read('src/components/drafting-tool.tsx')].join('\n');
  for (const literal of ['label="ENKH-ээс асуух"','label="Вэбээс хайх"','>Сүүлийн ажлууд<','label="Текст боловсруулах"']) assert.doesNotMatch(rendered, new RegExp(literal));
});
