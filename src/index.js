const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { createPaths } = require('./main/paths');
const { createPreferencesStore } = require('./main/preferencesStore');
const { createDeckStore } = require('./main/deckStore');
const { createCardImageService } = require('./main/cardImageService');
const { createPdfExporter } = require('./main/pdfExporter');
const { registerIpcHandlers } = require('./main/ipcHandlers');
const { showDeckMenu } = require('./main/contextMenu');

app.setName('DeckMaster');

if (require('electron-squirrel-startup')) app.quit();

const paths = createPaths(app);
const preferencesStore = createPreferencesStore(paths.prefsFile);
const deckStore = createDeckStore(paths.decksDir);
const cardImageService = createCardImageService();
const pdfExporter = createPdfExporter();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: paths.iconPath,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

registerIpcHandlers({ ipcMain, BrowserWindow, dialog, preferencesStore, deckStore, cardImageService, pdfExporter });
ipcMain.on('deck-show-context-menu', (event) => showDeckMenu(event, BrowserWindow));

app.whenReady().then(async () => {
  await fs.mkdir(paths.prefsDir, { recursive: true });
  await fs.mkdir(paths.decksDir, { recursive: true });
  if (!app.isPackaged && process.platform === 'darwin' && app.dock) app.dock.setIcon(paths.iconPath);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
