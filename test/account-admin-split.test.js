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
  for(const key of ['nav.admin','admin.title','admin.readOnly','admin.overview','admin.systemStatus','admin.management','admin.healthy','admin.disconnected','admin.pageContent','admin.dataDashboard','admin.manageUsersHelp','admin.managePageHelp','admin.manageDataHelp','admin.unavailableAction','admin.users','admin.usersHelp','admin.userStatus','admin.lastActivity']){
    assert.equal((source.match(new RegExp(`'${key.replace('.','\\.')}'`,'g'))||[]).length,3,key);
  }
});

test('admin overview uses compact localized hierarchy and bounded status badges without changing authorization',()=>{
  const screen=read('src/app/admin/index.tsx');
  for(const key of ['admin.overview','admin.systemStatus','admin.management']) assert.ok(screen.includes(`t('${key}')`));
  assert.match(screen,/numberOfLines=\{1\}/);
  assert.match(screen,/ellipsizeMode="tail"/);
  assert.match(screen,/router\.push\('\/admin\/users'/);
  assert.match(screen,/router\.push\('\/admin\/data'/);
  assert.match(screen,/accessibilityState=\{\{ disabled \}\}/);
  assert.match(screen,/getAdminOverview/);
  assert.doesNotMatch(screen,/read:admin-data|manage:page-content|email.*admin|admin.*email/i);
});

test('admin users uses credentialed read-only API and validates the list',async()=>{
  let request;
  const users=[{displayName:'Fixture',email:'fixture@example.test',status:'active',createdAt:'2026-01-01T00:00:00.000Z',lastActivityAt:null}];
  const loaded=loadApi(async(url,options)=>{request={url,options};return{ok:true,json:async()=>({success:true,users})}});
  try{assert.deepEqual(await loaded.api.getAdminUsers(),users);assert.equal(request.url,'https://api.enkhsystems.com/api/admin/users');assert.equal(request.options.credentials,'include');}finally{loaded.restore()}
});

test('admin users screen is protected, noindex, responsive, and excludes private content',()=>{
  const screen=read('src/app/admin/users.tsx');
  assert.match(screen,/getAdminUsers/); assert.match(screen,/noIndex/); assert.match(screen,/flexWrap:'wrap'/); assert.match(screen,/maxWidth:1100/);
  assert.doesNotMatch(screen,/auth0_sub|owner_key|workspace.*content|reminder.*note|token|secret|password/i);
});
