const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { UserPreferences } = require('./classes/UserPreferences');

app.setName('DeckMaster');

// Data storage paths
const PREFS_DIR = app.getPath('userData');
const PREFS_FILE = path.join(PREFS_DIR, 'userPreferences.json');
const DECKS_DIR = path.join(PREFS_DIR, 'Decks');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const iconPath = path.join(__dirname, '../build/icons/png/512x512.png');

if (!app.isPackaged && process.platform === 'darwin' && app.dock) {
  app.dock.setIcon(iconPath);
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

app.whenReady().then(async () => {
  // Ensure directories exist
  await fs.mkdir(PREFS_DIR, { recursive: true });
  await fs.mkdir(DECKS_DIR, { recursive: true });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Context Menu For New Deck Button
ipcMain.on('deck-show-context-menu', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const template = [
    { label: 'Build a deck from scratch', click: () => win.webContents.send('change-page', 'home') },
    { label: 'Load a saved deck', click: () => win.webContents.send('change-page', 'decks') },
    { label: 'Load deck from clipboard', click: () => win.webContents.send('change-page', 'settings') }
  ];
  Menu.buildFromTemplate(template).popup({ window: win });
});

// IPC: Read Preferences (Creates default on ENOENT)
ipcMain.handle('preferences:get', async () => {
  try {
    const data = await fs.readFile(PREFS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const defaultPrefs = new UserPreferences();
      await fs.writeFile(PREFS_FILE, defaultPrefs.toJson(), 'utf-8');
      return defaultPrefs.toObject();
    }
    console.error('Error reading preferences:', error);
    return new UserPreferences().toObject();
  }
});

// IPC: Save Preferences
ipcMain.handle('preferences:set', async (_event, prefsData) => {
  try {
    const userPreferences = UserPreferences.fromJson(prefsData);
    await fs.writeFile(PREFS_FILE, userPreferences.toJson(), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
});