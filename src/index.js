const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const https = require('node:https');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { UserPreferences } = require('./classes/UserPreferences');
const { getCardImageUrl } = require('./utils/getCardImage');

app.setName('DeckMaster');

// Data storage paths
const PREFS_DIR = app.getPath('userData');
const PREFS_FILE = path.join(PREFS_DIR, 'userPreferences.json');
const DECKS_DIR = path.join(PREFS_DIR, 'Decks');
const DECK_LIST_TEMPLATE_URL = 'https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-deck-list-85x11.pdf';

function downloadPdf(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadPdf(response.headers.location).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Deck-list template returned HTTP ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

function normalizedFieldName(field) {
  return field.getName().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function setPdfTextField(field, value) {
  if (typeof field.setText === 'function' && value) field.setText(String(value));
}

const deckFileForName = (name) => {
  const safeName = String(name || '').replace(/[^a-z0-9 _-]/gi, '').trim();
  return safeName ? path.join(DECKS_DIR, `${safeName}.json`) : null;
};

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
    { label: 'Load deck from clipboard', click: () => win.webContents.send('change-page', 'import') }
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

// IPC: Save an imported deck
ipcMain.handle('decks:save', async (_event, deckData) => {
  try {
    const name = String(deckData?.name || '').trim();
    const cards = Array.isArray(deckData?.cards) ? deckData.cards : [];
    if (!name || cards.length === 0) return false;

    const deckFile = deckFileForName(name);
    if (!deckFile) return false;
    await fs.writeFile(deckFile, JSON.stringify({
      name,
      cards,
      coverCard: deckData.coverCard || null,
    }, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving deck:', error);
    return false;
  }
});

// IPC: Fetch a card image without exposing the SDK to the renderer
ipcMain.handle('card-image:get', async (_event, card) => {
  if (!card?.set || card.number === undefined) return null;
  if (card.imageUrl) return card.imageUrl;
  return getCardImageUrl(card.set, card.number);
});

// IPC: Render a deck list as a PDF and let the user choose its destination
ipcMain.handle('decks:export-pdf', async (event, deckData) => {
  const name = String(deckData?.name || '').trim();
  const deckText = String(deckData?.text || '').trim();
  if (!name || !deckText) return false;

  const ownerWindow = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(ownerWindow, {
    title: 'Export decklist PDF',
    defaultPath: `${name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'decklist'}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return false;

  try {
    const template = await downloadPdf(DECK_LIST_TEMPLATE_URL);
    const document = await PDFDocument.load(template);
    const form = document.getForm();
    const fields = form.getFields();
    const preferences = deckData.preferences || {};
    const fullName = [preferences.firstName, preferences.lastName].filter(Boolean).join(' ') || preferences.displayName;
    const cardLines = deckText.split('\n');

    fields.forEach((field) => {
      const fieldName = normalizedFieldName(field);
      if (fieldName.includes('playerid')) setPdfTextField(field, preferences.playerId);
      else if (fieldName.includes('displayname') || fieldName === 'name' || fieldName.includes('playername')) setPdfTextField(field, fullName);
      else if (fieldName.includes('firstname')) setPdfTextField(field, preferences.firstName);
      else if (fieldName.includes('lastname')) setPdfTextField(field, preferences.lastName);
      else if (fieldName.includes('dateofbirth') || fieldName === 'dob' || fieldName.includes('birth')) setPdfTextField(field, preferences.dateOfBirth);
      else if (fieldName.includes('deckname') || fieldName === 'deck') setPdfTextField(field, name);
      else if (fieldName.includes('decklist') || fieldName.includes('cardlist')) setPdfTextField(field, deckText);
      else {
        const rowMatch = fieldName.match(/(?:card|pokemon|trainer|energy|list)(\d+)/);
        if (rowMatch) setPdfTextField(field, cardLines[Number(rowMatch[1]) - 1]);
      }
    });

    const font = await document.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);
    form.flatten();
    const pdf = await document.save();
    await fs.writeFile(filePath, pdf);
    return true;
  } catch (error) {
    console.error('Error exporting deck PDF:', error);
    return false;
  }
});

// IPC: Delete a saved deck
ipcMain.handle('decks:delete', async (_event, name) => {
  try {
    const deckFile = deckFileForName(name);
    if (!deckFile) return false;
    await fs.unlink(deckFile);
    return true;
  } catch (error) {
    console.error('Error deleting deck:', error);
    return false;
  }
});

// IPC: List saved decks
ipcMain.handle('decks:list', async () => {
  try {
    const files = await fs.readdir(DECKS_DIR);
    const decks = [];
    for (const file of files.filter((entry) => entry.endsWith('.json'))) {
      try {
        const data = await fs.readFile(path.join(DECKS_DIR, file), 'utf-8');
        const deck = JSON.parse(data);
        if (deck?.name && Array.isArray(deck.cards)) decks.push(deck);
      } catch (error) {
        console.error(`Error reading deck file ${file}:`, error);
      }
    }
    return decks;
  } catch (error) {
    console.error('Error listing decks:', error);
    return [];
  }
});