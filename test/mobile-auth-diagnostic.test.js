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
const { atMobileAuthStage, formatMobileAuthDiagnostic, MobileAuthDiagnosticError } = moduleRef.exports;

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
  assert.equal(formatMobileAuthDiagnostic(new Error('MOBILE_AUTH_CANCELLED'), 'browser_prompt'),
    'stage=browser_prompt class=Error code=MOBILE_AUTH_CANCELLED');
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
