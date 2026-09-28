const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const test=require('node:test');
const root=join(__dirname,'..'); const read=file=>readFileSync(join(root,file),'utf8');

test('Control Center is private, noindex, and gracefully tolerates undeployed APIs',()=>{
  const page=read('src/app/admin/control.tsx'); const api=read('src/admin/control-api.ts');
  assert.match(page,/getAdminOverview\(\)/); assert.match(page,/noIndex/); assert.match(api,/response\.status === 404/);
  assert.match(api,/credentials: 'include'/); assert.doesNotMatch(api,/POST|PUT|PATCH|DELETE/);
});
test('status UI names evidence classes and never fabricates healthy or online state',()=>{
  const files=['src/admin/control-types.ts','src/components/admin-platform-card.tsx','src/components/admin-control-overview.tsx'].map(read).join('\n');
  for(const value of ['configured','reported','observed','deployment','unknown']) assert.match(files,new RegExp(value));
  assert.doesNotMatch(files,/Healthy|Online|active users/i);
});
test('remote configuration is visibly read-only and release history has a truthful empty state',()=>{
  const config=read('src/components/admin-config-editor.tsx'); const releases=read('src/components/admin-release-history.tsx');
  assert.match(config,/accessibilityState=\{\{disabled:true\}\}/); assert.doesNotMatch(config,/onPress|fetch/);
  assert.match(releases,/if \(!releases\?\.length\)/); assert.match(releases,/releaseTruth/);
});
test('responsive layout wraps and avoids fixed viewport widths',()=>{
  const files=['src/app/admin/control.tsx','src/components/admin-control-overview.tsx','src/components/admin-platform-card.tsx'].map(read).join('\n');
  assert.match(files,/flexWrap:'wrap'/); assert.match(files,/maxWidth:1080/); assert.doesNotMatch(files,/width:\s*(1280|390)/);
});
test('Control Center exposes no secret, token, database URL, localhost, or raw user content',()=>{
  const files=['src/app/admin/control.tsx','src/admin/control-api.ts','src/admin/control-types.ts','src/components/admin-control-overview.tsx'].map(read).join('\n');
  assert.doesNotMatch(files,/client_secret|access_token|refresh_token|DATABASE_URL|postgres(?:ql)?:\/\/|localhost|raw.*claims|raw.*content/i);
});
