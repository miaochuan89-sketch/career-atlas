const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('careerAtlas', {
  exportCsv: (payload) => ipcRenderer.invoke('export-csv', payload),
  importTaskPlan: () => ipcRenderer.invoke('import-task-plan'),
  exportTaskPlan: (payload) => ipcRenderer.invoke('export-task-plan', payload),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: (payload) => ipcRenderer.invoke('install-update', payload)
});
