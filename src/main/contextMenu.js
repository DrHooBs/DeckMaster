const { Menu } = require('electron');

function showDeckMenu(event, BrowserWindow) {
  const window = BrowserWindow.fromWebContents(event.sender);
  const template = [
    { label: 'Build a deck from scratch', click: () => window.webContents.send('change-page', 'home') },
    { label: 'Load a saved deck', click: () => window.webContents.send('change-page', 'decks') },
    { label: 'Load deck from clipboard', click: () => window.webContents.send('change-page', 'import') },
  ];
  Menu.buildFromTemplate(template).popup({ window });
}

module.exports = { showDeckMenu };
