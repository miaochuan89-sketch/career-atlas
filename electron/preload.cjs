const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('careerAtlas', {
  exportCsv: (payload) => ipcRenderer.invoke('export-csv', payload),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  exportResumePdf: (resume) => ipcRenderer.invoke('export-resume-pdf', resume),
  exportResumeWord: (resume) => ipcRenderer.invoke('export-resume-word', resume),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: (payload) => ipcRenderer.invoke('install-update', payload)
});
