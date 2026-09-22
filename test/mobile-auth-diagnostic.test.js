const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '..', 'src', 'mobile', 'auth-diagnostic.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const moduleRef = { exports: {} };
new Function('exports', 'require', 'module', code)(moduleRef.exports, require, moduleRef);
const { atMobileAuthStage, formatMobileAuthDiagnostic, MobileAuthDiagnosticError,
  mobileAuthPromptFailureCode } = moduleRef.exports;

test('every sign-in stage yields only a bounded stage, class and allowlisted code', async () => {
  const stages = ['config', 'secure_store', 'discovery', 'auth_request', 'browser_prompt',
    'token_exchange', 'token_validation', 'secure_store_save', 'chat_pull'];
  for (const stage of stages) {
    await assert.rejects(atMobileAuthStage(stage, () => { throw new Error('MOBILE_AUTH_NOT_CONFIGURED'); }),
      (error) => error instanceof MobileAuthDiagnosticError && error.stage === stage &&
        formatMobileAuthDiagnostic(error, 'chat_pull') ===
          `stage=${stage} class=Error code=MOBILE_AUTH_NOT_CONFIGURED`);
  }
});

test('private exception details, URLs and arbitrary codes never enter diagnostics', () => {
  const secret = 'https://issuer.example/authorize?code=private-token&password=private';
  const error = Object.assign(new TypeError(secret), { code: secret, stack: secret });
  const diagnostic = formatMobileAuthDiagnostic(error, 'discovery');
  assert.equal(diagnostic, 'stage=discovery class=TypeError code=UNCLASSIFIED');
  assert.equal(diagnostic.includes(secret), false);
  assert.equal(formatMobileAuthDiagnostic('private-token', 'chat_pull'),
    'stage=chat_pull class=Unknown code=UNCLASSIFIED');
  assert.equal(formatMobileAuthDiagnostic(new Error('MOBILE_AUTH_CANCEL'), 'browser_prompt'),
    'stage=browser_prompt class=Error code=MOBILE_AUTH_CANCEL');
});

test('prompt results distinguish cancellation, dismissal, lock, OAuth error and malformed success', () => {
  const cases = [
    [{ type: 'cancel' }, true, 'MOBILE_AUTH_CANCEL'],
    [{ type: 'dismiss' }, true, 'MOBILE_AUTH_DISMISS'],
    [{ type: 'locked' }, true, 'MOBILE_AUTH_LOCKED'],
    [{ type: 'error', error: { description: 'private' } }, true, 'MOBILE_AUTH_OAUTH_ERROR'],
    [{ type: 'success', params: {} }, true, 'MOBILE_AUTH_MISSING_CODE'],
    [{ type: 'success', params: { code: 'private-code' } }, false, 'MOBILE_AUTH_MISSING_VERIFIER'],
    [{ type: 'opened' }, true, 'MOBILE_AUTH_BROWSER_ERROR'],
    [null, true, 'MOBILE_AUTH_BROWSER_ERROR'],
    [{ type: 'success', params: { code: 'private-code' } }, true, null],
  ];
  for (const [result, hasVerifier, expected] of cases)
    assert.equal(mobileAuthPromptFailureCode(result, hasVerifier), expected);
});

test('redirect comparison emits only a boolean, never the raw redirect or OAuth fields', async () => {
  for (const redirectMatch of [true, false]) {
    const secret = 'enkhapp://auth?code=private&state=private';
    await assert.rejects(atMobileAuthStage('browser_prompt', () => {
      throw Object.assign(new Error(secret), { code: 'MOBILE_AUTH_OAUTH_ERROR' });
    }, redirectMatch), (error) => {
      const output = formatMobileAuthDiagnostic(error, 'chat_pull');
      assert.equal(output, `stage=browser_prompt class=Error code=MOBILE_AUTH_OAUTH_ERROR redirectMatch=${redirectMatch}`);
      assert.equal(output.includes(secret), false);
      return true;
    });
  }
  const auth = readFileSync(join(__dirname, '..', 'src', 'mobile', 'auth.native.ts'), 'utf8');
  assert.match(auth, /redirect === 'enkhapp:\/\/auth'/);
  assert.match(auth, /redirectUri: redirect/g);
  assert.doesNotMatch(auth, /console\.(log|error|warn)\(/);
});

test('native sign-in wraps each operation and UI never displays raw error details', () => {
  const auth = readFileSync(join(__dirname, '..', 'src', 'mobile', 'auth.native.ts'), 'utf8');
  const screen = readFileSync(join(__dirname, '..', 'src', 'components', 'mobile-chat.native.tsx'), 'utf8');
  for (const stage of ['config', 'secure_store', 'discovery', 'auth_request', 'browser_prompt',
    'token_exchange', 'token_validation', 'secure_store_save'])
    assert.match(auth, new RegExp(`atMobileAuthStage\\('${stage}'`));
  assert.match(screen, /formatMobileAuthDiagnostic\(error, 'chat_pull'\)/);
  assert.doesNotMatch(screen, /(?:error|err)\.message|JSON\.stringify\(error\)/);
});
