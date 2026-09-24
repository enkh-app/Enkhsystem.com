const test = require('node:test');
const assert = require('node:assert/strict');
const { createNavigationPolicy, isAllowedNavigation, isSafeExternalUrl } = require('../dist/src/navigation-policy.js');

const policy = createNavigationPolicy();

test('allows only required ENKH production navigation', () => {
  assert.equal(isAllowedNavigation('https://enkhsystems.com/chat', policy), true);
  assert.equal(isAllowedNavigation('https://api.enkhsystems.com/auth/login?returnTo=%2Fauth%2Faccount-complete', policy), true);
});

test('allows the exact Auth0 and Google authentication origins', () => {
  assert.equal(isAllowedNavigation('https://dev-4fxiys6k3ogwhhfl.us.auth0.com/authorize', policy), true);
  assert.equal(isAllowedNavigation('https://accounts.google.com/o/oauth2/v2/auth', policy), true);
});

test('blocks malformed, insecure, credentialed, and unapproved navigation', () => {
  for (const url of [
    'http://enkhsystems.com',
    'https://evil.example/phish',
    'javascript:alert(1)',
    'file:///C:/Windows/System32/calc.exe',
    'https://user:password@enkhsystems.com',
    'not a URL',
  ]) assert.equal(isAllowedNavigation(url, policy), false, url);
});

test('validates the configured Auth0 origin fail closed', () => {
  assert.throws(() => createNavigationPolicy('http://tenant.auth0.com'), /INVALID_DESKTOP_ORIGIN/);
  assert.throws(() => createNavigationPolicy('https://tenant.auth0.com/path'), /INVALID_DESKTOP_ORIGIN/);
  assert.throws(() => createNavigationPolicy('https://user:pass@tenant.auth0.com'), /INVALID_DESKTOP_ORIGIN/);
});

test('external URL policy accepts safe browser targets and rejects dangerous schemes', () => {
  assert.equal(isSafeExternalUrl('https://docs.example.com/help'), true);
  assert.equal(isSafeExternalUrl('mailto:support@example.com'), true);
  assert.equal(isSafeExternalUrl('http://docs.example.com'), false);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('file:///C:/Windows/System32/calc.exe'), false);
  assert.equal(isSafeExternalUrl('https://user:pass@docs.example.com'), false);
});
