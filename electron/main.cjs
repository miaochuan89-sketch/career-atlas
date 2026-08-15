const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const UPDATE_REPO = 'miaochuan89-sketch/career-atlas';

function newer(remote, local) {
  const a = remote.replace(/^v/, '').split('.').map(Number);
  const b = local.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0); }
  return false;
}

async function latestRelease() {
  const response = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, { headers: { 'User-Agent': 'Career-Atlas-Updater', 'Accept': 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`Update service returned ${response.status}`);
  return response.json();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#f4f1eb',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
}

ipcMain.handle('export-csv', async (_event, { filename, content }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [{ name: 'CSV file', extensions: ['csv'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.writeFileSync(result.filePath, '\uFEFF' + content, 'utf8');
  return { canceled: false, path: result.filePath };
});
ipcMain.handle('open-external', async (_event, url) => {
  if (!/^https:\/\//i.test(url)) throw new Error('Only secure web links are allowed');
  await shell.openExternal(url);
  return true;
});
ipcMain.handle('check-update', async () => {
  try {
    const release = await latestRelease();
    const asset = release.assets.find(a => /^Career-Atlas-Setup-.*\.exe$/i.test(a.name));
    return { ok: true, available: newer(release.tag_name, app.getVersion()), current: app.getVersion(), latest: release.tag_name.replace(/^v/, ''), notes: release.body || '', downloadUrl: asset?.browser_download_url || null, assetName: asset?.name || null };
  } catch (error) { return { ok: false, message: error.message }; }
});
ipcMain.handle('install-update', async (_event, { downloadUrl, assetName }) => {
  if (!/^https:\/\/github\.com\/miaochuan89-sketch\/career-atlas\/releases\/download\//i.test(downloadUrl || '')) throw new Error('Invalid update source');
  const target = path.join(app.getPath('temp'), assetName || 'Career-Atlas-Update.exe');
  const response = await fetch(downloadUrl, { headers: { 'User-Agent': 'Career-Atlas-Updater' }, redirect: 'follow' });
  if (!response.ok || !response.body) throw new Error(`Download failed (${response.status})`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(target));
  const error = await shell.openPath(target);
  if (error) throw new Error(error);
  setTimeout(() => app.quit(), 800);
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
