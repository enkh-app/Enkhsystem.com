const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = join(__dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

function loadApi(fetchImpl) {
  const code = ts.transpileModule(read('src/api.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; const previousFetch = global.fetch; const previousDev = global.__DEV__;
  global.fetch = fetchImpl; global.__DEV__ = false;
  new Function('exports','require','module','__filename','__dirname',code)(module.exports,require,module,'api.ts',__dirname);
  return { api: module.exports, restore:()=>{global.fetch=previousFetch;global.__DEV__=previousDev;} };
}

test('admin overview uses the credentialed backend route and validates read-only data', async()=>{
  let request;
  const loaded=loadApi(async(url,options)=>{request={url,options};return{ok:true,json:async()=>({success:true,data:{readOnly:true}})}});
  try{await loaded.api.getAdminOverview();assert.equal(request.url,'https://api.enkhsystems.com/api/admin/overview');assert.equal(request.options.credentials,'include');}finally{loaded.restore()}
});

test('admin navigation is hidden until server-verified auth state grants admin',()=>{
  const header=read('src/components/app-header.tsx');
  assert.match(header,/getAuthState\(\)/);
  assert.match(header,/state\.authenticated&&state\.admin/);
  assert.match(header,/showAdmin&&link\(adminItem\)/);
  assert.doesNotMatch(header,/email.*admin|admin.*email/i);
});

test('account stays owner-scoped while admin is direct-API protected and noindex',()=>{
  const account=read('src/app/account.tsx'); const admin=read('src/app/admin/index.tsx');
  assert.match(account,/nav\.workspace/); assert.match(account,/tool\.reminder/);
  assert.doesNotMatch(account,/getAdminOverview|system-wide|api\/admin/);
  assert.match(admin,/getAdminOverview/); assert.match(admin,/noIndex/); assert.match(admin,/readOnly/);
  assert.doesNotMatch(admin,/auth_subject|owner_key|DATABASE_URL|token|secret|password/i);
});

test('admin labels are complete in all three dictionaries',()=>{
  const source=read('src/i18n.tsx');
  for(const key of ['nav.admin','admin.title','admin.readOnly','admin.accounts','admin.reminders','admin.operations','admin.data']){
    assert.equal((source.match(new RegExp(`'${key.replace('.','\\.')}'`,'g'))||[]).length,3,key);
  }
});
