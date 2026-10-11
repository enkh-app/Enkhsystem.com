const assert=require('node:assert/strict'); const {readFileSync}=require('node:fs'); const {join}=require('node:path'); const test=require('node:test');
const root=join(__dirname,'..'); const read=file=>readFileSync(join(root,file),'utf8');
test('text action has localized presentation without rewriting aggregate data',()=>{
  const page=read('src/app/admin/interests.tsx');
  assert.match(page,/item.label === 'text' \? t\('interests.actionText'\) : item.label/);
  assert.match(page,/key=\{item.label\}/);
  assert.match(page,/\{item.count\}/);
  const copy=read('src/i18n.tsx');
  for(const label of ['Текст боловсруулах','Text processing','文本处理']) assert.ok(copy.includes("'interests.actionText':'"+label+"'"));
});
test('interest report is private, aggregate-only, responsive and noindex',()=>{const page=read('src/app/admin/interests.tsx');const api=read('src/api.ts');assert.match(page,/noIndex/);assert.match(api,/\/api\/admin\/interests/);assert.match(api,/credentials: 'include'/);assert.doesNotMatch(page,/email|message content|owner_user_id/i);assert.match(page,/flexWrap:'wrap'/);assert.match(page,/flexShrink:1/);for(const state of ["state==='loading'","state==='forbidden'","state==='error'","data.topics.length"])assert.match(page,new RegExp(state.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));});
test('Control Center explains evidence and only renders source/time conditionally',()=>{const card=read('src/components/admin-platform-card.tsx');const overview=read('src/components/admin-control-overview.tsx');assert.match(card,/\(source \|\| checkedAt\)/);assert.match(overview,/copy\.legend/);assert.doesNotMatch(overview,/Ажиллаж байна|Healthy|Online/);});
test('web export config treats expo-sqlite wasm as an asset',()=>{const metro=read('metro.config.js');assert.match(metro,/expo\/metro-config/);assert.match(metro,/assetExts\.push\('wasm'\)/);});
