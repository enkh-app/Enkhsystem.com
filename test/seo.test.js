const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('robots and sitemap expose only intended canonical public routes', () => {
  const robots = read('public/robots.txt');
  const sitemap = read('public/sitemap.xml');
  const appConfig = JSON.parse(read('app.json'));
  assert.match(robots, /Sitemap: https:\/\/enkhsystems\.com\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/admin\//);
  for (const path of ['/', '/chat', '/search', '/tools', '/tools/calculation', '/action-text', '/action-message', '/action-document', '/status']) {
    assert.match(sitemap, new RegExp(`<loc>https://enkhsystems\\.com${path === '/' ? '/' : path.replace('/', '\\/')}</loc>`));
  }
  assert.doesNotMatch(sitemap, /workspace|account|admin/);
  assert.equal(appConfig.expo.plugins[0][0], 'expo-router');
  assert.equal(appConfig.expo.plugins[0][1].sitemap, false);
});

test('shared SEO head includes canonical, social, robots and safe structured data', () => {
  const seo = read('src/components/seo-head.tsx');
  for (const marker of ['meta name="description"', 'meta name="robots"', 'rel="canonical"', 'property="og:title"', 'property="og:description"', 'property="og:url"', 'name="twitter:card"', 'application/ld+json']) {
    assert.ok(seo.includes(marker), marker);
  }
  assert.match(seo, /'Organization'/);
  assert.match(seo, /'WebSite'/);
  assert.match(seo, /alternateName: 'Enkh AI'/);
  assert.doesNotMatch(seo, /rating|review|customer|award|sameAs/);
});

test('public routes have unique canonical metadata and private routes are noindex', () => {
  const publicFiles = [
    'src/app/index.tsx', 'src/app/chat.tsx', 'src/app/knowledge-search.tsx',
    'src/app/actions.tsx', 'src/app/tools/calculation.tsx', 'src/components/drafting-tool.tsx',
  ].map(read).join('\n');
  for (const path of ['/', '/chat', '/search', '/tools', '/tools/calculation', '/action-text', '/action-message', '/action-document']) {
    assert.ok(publicFiles.includes(`path="${path}"`) || publicFiles.includes(`'${path}'`), path);
  }
  for (const file of ['src/app/workspace.tsx', 'src/app/account.tsx', 'src/app/admin/data.tsx']) {
    assert.match(read(file), /<SeoHead[^>]*noIndex/);
  }
});

test('home has crawlable factual ENKH and Enkh AI product copy', () => {
  const home = read('src/app/index.tsx');
  assert.match(home, /home\.aboutTitle/);
  assert.match(read('src/i18n.tsx'), /ENKH буюу Enkh AI/);
  const i18n = read('src/i18n.tsx');
  for (const capability of ['вэб хайлт', 'тооцоо', 'текст боловсруулах', 'мессеж', 'баримт бичиг']) assert.match(i18n, new RegExp(capability, 'i'));
});
