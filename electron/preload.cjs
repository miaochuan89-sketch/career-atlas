const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('careerAtlas', {
  exportCsv: (payload) => ipcRenderer.invoke('export-csv', payload),
  importTaskPlan: () => ipcRenderer.invoke('import-task-plan'),
  exportTaskPlan: (payload) => ipcRenderer.invoke('export-task-plan', payload),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  exportResumePdf: (resume) => ipcRenderer.invoke('export-resume-pdf', resume),
  exportResumeWord: (resume) => ipcRenderer.invoke('export-resume-word', resume),
  renderResumePreview: (resume) => ipcRenderer.invoke('render-resume-preview', resume),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: (payload) => ipcRenderer.invoke('install-update', payload)
});
