const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('careerAtlas', {
  exportCsv: (payload) => ipcRenderer.invoke('export-csv', payload),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: (payload) => ipcRenderer.invoke('install-update', payload)
});
