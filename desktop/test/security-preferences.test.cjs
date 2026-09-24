const test = require('node:test');
const assert = require('node:assert/strict');
const { SECURITY_WEB_PREFERENCES } = require('../dist/src/security-preferences.js');

test('Electron renderer security preferences remain hardened', () => {
  assert.deepEqual(SECURITY_WEB_PREFERENCES, {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
  });
});

test('preference object does not expose privileged renderer features', () => {
  assert.equal(Object.isFrozen(SECURITY_WEB_PREFERENCES), true);
  assert.equal('webviewTag' in SECURITY_WEB_PREFERENCES, false);
  assert.equal('nodeIntegrationInWorker' in SECURITY_WEB_PREFERENCES, false);
});
