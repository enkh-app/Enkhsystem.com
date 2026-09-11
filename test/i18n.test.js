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
