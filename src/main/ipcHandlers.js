function registerIpcHandlers({ ipcMain, BrowserWindow, dialog, preferencesStore, deckStore, cardImageService, pdfExporter }) {
  ipcMain.handle('preferences:get', () => preferencesStore.get());
  ipcMain.handle('preferences:set', (_event, data) => preferencesStore.save(data));
  ipcMain.handle('decks:save', (_event, data) => deckStore.save(data));
  ipcMain.handle('decks:list', () => deckStore.list());
  ipcMain.handle('decks:delete', (_event, name) => deckStore.delete(name));
  ipcMain.handle('card-image:get', (_event, card) => cardImageService.get(card));
  ipcMain.handle('decks:export-pdf', (event, data) => pdfExporter.export(BrowserWindow.fromWebContents(event.sender), data, dialog));
}

module.exports = { registerIpcHandlers };
