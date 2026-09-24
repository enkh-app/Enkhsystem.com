const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('desktop branding uses the approved ENKH AI name and Windows icon', () => {
  const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const builderConfig = fs.readFileSync(path.join(__dirname, '..', 'electron-builder.yml'), 'utf8');

  assert.match(mainSource, /title: 'ENKH AI'/);
  assert.match(mainSource, /icon: desktopIcon/);
  assert.match(mainSource, /app\.setName\('ENKH AI'\)/);
  assert.match(mainSource, /app\.setAppUserModelId\('com\.enkhsystems\.enkhai'\)/);
  assert.match(builderConfig, /appId: com\.enkhsystems\.enkhai/);
  assert.match(builderConfig, /productName: ENKH AI/);
  assert.match(builderConfig, /executableName: ENKH AI/);
  assert.match(builderConfig, /icon: assets\/enkh\.ico/);
  assert.match(builderConfig, /installerIcon: assets\/enkh\.ico/);
  assert.match(builderConfig, /uninstallerIcon: assets\/enkh\.ico/);
  assert.match(builderConfig, /installerHeaderIcon: assets\/enkh\.ico/);
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'assets', 'enkh.ico')), true);
});
