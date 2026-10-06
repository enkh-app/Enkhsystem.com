const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/components/seo-head.tsx'), 'utf8');
function load(platform) {
  const calls = [];
  const Head = function Head() {};
  const jsx = (type, props) => { calls.push(type); return { type, props }; };
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const mockRequire = id => {
    if (id === 'expo-router/head') return { __esModule: true, default: Head };
    if (id === 'react-native') return { Platform: { OS: platform } };
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    throw new Error('Unexpected module');
  };
  new Function('exports', 'require', 'module', code)(module.exports, mockRequire, module);
  return { ...module.exports, calls, Head };
}
const props = { title: 'ENKH', description: 'Description', path: '/action-document', noIndex: true, structuredData: { '@type': 'WebSite' } };

test('iOS and Android SEO never construct Head or native Handoff metadata', () => {
  for (const platform of ['ios', 'android']) {
    const seo = load(platform);
    assert.equal(seo.SeoHead(props), null);
    assert.deepEqual(seo.calls, []);
  }
});
test('web retains canonical, noindex, social tags and structured data', () => {
  const seo = load('web');
  const rendered = seo.SeoHead(props);
  assert.equal(rendered.type, seo.Head);
  const children = rendered.props.children;
  assert.equal(children.find(c => c?.type === 'title').props.children, props.title);
  assert.equal(children.find(c => c?.props.name === 'robots').props.content, 'noindex, nofollow');
  assert.equal(children.find(c => c?.props.rel === 'canonical').props.href, 'https://enkhsystems.com/action-document');
  assert.equal(children.find(c => c?.props.property === 'og:title').props.content, props.title);
  assert.equal(children.find(c => c?.type === 'script').props.children, JSON.stringify(props.structuredData));
  assert.equal(seo.SeoHead({ ...props, path: '/', noIndex: false }).props.children.find(c => c?.props.rel === 'canonical').props.href, 'https://enkhsystems.com');
});
test('all direct Router Head imports remain centralized behind the platform guard', () => {
  const root = path.join(__dirname, '../src');
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  }
  const imports = walk(root).filter(file => /\.[jt]sx?$/.test(file) && /from ['"]expo-router\/head['"]/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(imports.map(file => path.relative(root, file).replaceAll('\\', '/')), ['components/seo-head.tsx']);
});
