import path from 'node:path';
import { app, BrowserWindow, session, shell, type WebContents } from 'electron';
import { createNavigationPolicy, isAllowedNavigation, isSafeExternalUrl } from './navigation-policy';
import { SECURITY_WEB_PREFERENCES } from './security-preferences';
import { DEVELOPMENT_USER_DATA_DIRECTORY, selectDesktopLaunchTarget } from './launch-target';

const policy = createNavigationPolicy(process.env.ENKH_DESKTOP_AUTH0_ORIGIN);
const desktopIcon = path.join(__dirname, '..', '..', 'assets', 'enkh.ico');
let mainWindow: BrowserWindow | null = null;

function openExternalSafely(url: string) {
  if (isSafeExternalUrl(url)) void shell.openExternal(url);
}

function secureContents(contents: WebContents) {
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url, policy)) event.preventDefault();
  });
  contents.on('will-redirect', (event, url) => {
    if (!isAllowedNavigation(url, policy)) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url, policy)) {
      if (mainWindow && !mainWindow.isDestroyed()) void mainWindow.loadURL(url);
    } else {
      openExternalSafely(url);
    }
    return { action: 'deny' };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'ENKH AI',
    icon: desktopIcon,
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#F4F8FD',
    autoHideMenuBar: true,
    webPreferences: {
      ...SECURITY_WEB_PREFERENCES,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  secureContents(mainWindow.webContents);
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  if (selectDesktopLaunchTarget(process.env.ENKH_DESKTOP_REMOTE_POC) === 'remote-poc') {
    void mainWindow.loadURL(policy.appUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }
}

// Development must not focus an already-installed ENKH instance through a shared single-instance lock.
// Packaged builds keep their stable product user-data identity.
if (!app.isPackaged) {
  app.setPath('userData', path.join(app.getPath('appData'), DEVELOPMENT_USER_DATA_DIRECTORY));
}

const lockAcquired = app.requestSingleInstanceLock();
if (!lockAcquired) {
  app.quit();
} else {
  app.setName('ENKH AI');
  app.setAppUserModelId('com.enkhsystems.enkhai');
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    createWindow();
  });

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => app.quit());
}
