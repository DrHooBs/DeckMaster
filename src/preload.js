const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  deckShowContextMenu: () => ipcRenderer.send('deck-show-context-menu'),
  onPageChange: (callback) => {
    ipcRenderer.on('change-page', (_event, pageId) => callback(pageId));
  },
  getUserPreferences: () => ipcRenderer.invoke('preferences:get'),
  saveUserPreferences: (prefs) => ipcRenderer.invoke('preferences:set', prefs),
  saveDeck: (deck) => ipcRenderer.invoke('decks:save', deck),
  getDecks: () => ipcRenderer.invoke('decks:list'),
  deleteDeck: (name) => ipcRenderer.invoke('decks:delete', name),
  getCardImage: (card) => ipcRenderer.invoke('card-image:get', card),
  exportDeckPdf: (deck) => ipcRenderer.invoke('decks:export-pdf', deck),
});