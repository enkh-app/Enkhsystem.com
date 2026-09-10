const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');
const root = join(__dirname, '..'); const read = (file) => readFileSync(join(root, file), 'utf8');
function loadTime() { const code=ts.transpileModule(read('src/reminder-time.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('exports','require','module',code)(module.exports,require,module);return module.exports; }
test('Asia/Ulaanbaatar local time converts through IANA timezone to UTC',()=>{const {localDateTimeToUtc}=loadTime();assert.equal(localDateTimeToUtc('2026-09-11','10:00','Asia/Ulaanbaatar'),'2026-09-11T02:00:00.000Z');assert.equal(localDateTimeToUtc('2026-09-11','10:00','UTC+8'),null);});
test('natural reminder parsing is narrow and requires explicit review',()=>{const {parseSafeNaturalReminder}=loadTime();const parsed=parseSafeNaturalReminder('Маргааш 10:00-д Мягмартай уулзахыг сануул.',new Date('2026-09-10T02:00:00Z'));assert.equal(parsed.date,'2026-09-11');assert.equal(parsed.time,'10:00');assert.equal(parseSafeNaturalReminder('Дараа уулзалтыг сануул'),null);assert.match(read('src/app/action-reminder.tsx'),/Хадгалахаас өмнө огноо, цагийг нягтал/);});
test('reminder UI uses authenticated durable CRUD and never browser timers',()=>{const screen=read('src/app/action-reminder.tsx');const api=read('src/api.ts');assert.match(api,/\/api\/reminders/);assert.match(screen,/createReminder/);assert.match(screen,/updateReminder/);assert.match(screen,/cancelReminder/);assert.doesNotMatch(screen,/setTimeout|Notification\(/);assert.match(screen,/backgroundWorkspaceSync\.schedule/);});
test('static export starts with deterministic reminder markup',()=>{const screen=read('src/app/action-reminder.tsx');assert.match(screen,/useState\(''\).*setDate\(tomorrow\(\)\)/s);assert.doesNotMatch(screen,/useState\(tomorrow\(\)\)/);});
test('tools advertise the real reminder without claiming email or push',()=>{const tools=read('src/app/actions.tsx');assert.match(tools,/route: '\/action-reminder'/);assert.doesNotMatch(tools,/const upcoming = \['Сануулга'\]/);assert.doesNotMatch(read('src/app/action-reminder.tsx'),/deliveryChannel:'email'|deliveryChannel:'push'/);});
