const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openMenu: () => ipcRenderer.send('show-context-menu'),
  onPageChange: (callback) => {
    ipcRenderer.on('change-page', (_event, pageId) => callback(pageId));
  },
  getUserPreferences: () => ipcRenderer.invoke('preferences:get'),
  saveUserPreferences: (prefs) => ipcRenderer.invoke('preferences:set', prefs),
});