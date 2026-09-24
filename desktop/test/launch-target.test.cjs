const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DEVELOPMENT_USER_DATA_DIRECTORY, selectDesktopLaunchTarget } = require('../dist/src/launch-target.js');

test('unset remote POC environment selects the bundled local renderer', () => {
  assert.equal(selectDesktopLaunchTarget(undefined), 'local-renderer');
  assert.equal(selectDesktopLaunchTarget(''), 'local-renderer');
});

test('remote POC zero selects the bundled local renderer', () => {
  assert.equal(selectDesktopLaunchTarget('0'), 'local-renderer');
});

test('only exact remote POC one selects the production wrapper', () => {
  assert.equal(selectDesktopLaunchTarget('1'), 'remote-poc');
  assert.equal(selectDesktopLaunchTarget('true'), 'local-renderer');
  assert.equal(selectDesktopLaunchTarget('1 '), 'local-renderer');
});

test('development and packaged entry use the same selection contract', () => {
  for (const isPackaged of [false, true]) {
    assert.equal(selectDesktopLaunchTarget(undefined), 'local-renderer', `packaged=${isPackaged}`);
    assert.equal(selectDesktopLaunchTarget('1'), 'remote-poc', `packaged=${isPackaged}`);
  }
});

test('development single-instance data is isolated before lock acquisition', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
  assert.equal(DEVELOPMENT_USER_DATA_DIRECTORY, 'ENKH AI Development');
  assert.ok(main.indexOf("app.setPath('userData'") < main.indexOf('app.requestSingleInstanceLock()'));
  assert.match(main, /if \(!app\.isPackaged\)/);
});
