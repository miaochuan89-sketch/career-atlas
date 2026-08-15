const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const UPDATE_REPO = 'miaochuan89-sketch/career-atlas';

// Prefer the stable software-rendering path on Windows Insider builds and
// graphics drivers that can crash Chromium before the first window appears.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-sandbox');
if (process.env.CAREER_ATLAS_QA_PDF) app.setPath('userData', path.join(path.dirname(process.env.CAREER_ATLAS_QA_PDF), 'qa-user-data'));

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
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
}

const htmlEscape = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const safeFileName = value => String(value || 'Career-Atlas-Resume').replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, ' ').trim();
function resumeSection(title, content) {
  if (!String(content || '').trim()) return '';
  const groups = String(content).trim().split(/\r?\n\s*\r?\n/);
  const lineHtml = (line, index) => {
    const clean=line.trim();
    if (/^[•-]/.test(clean)) return `<div class="bullet">• ${htmlEscape(clean.replace(/^[•-]\s*/,''))}</div>`;
    const parts=clean.split(/\s+\|\s+/), left=parts.shift(), right=parts.join(' | ');
    return `<div class="entry ${index===0?'primary':'secondary'}"><span>${htmlEscape(left)}</span>${right?`<span>${htmlEscape(right)}</span>`:''}</div>`;
  };
  return `<section>${String(title||'').trim()?`<h2>${htmlEscape(title)}</h2>`:''}${groups.map(group=>`<div class="group">${group.split(/\r?\n/).filter(Boolean).map(lineHtml).join('')}</div>`).join('')}</section>`;
}
function resumeHtml(r) {
  const contact = [r.location, r.phone, r.email, r.linkedin, r.portfolio].filter(Boolean).map(htmlEscape).join('  |  ');
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:Letter;margin:.43in .5in}*{box-sizing:border-box}body{font-family:"Times New Roman",Times,serif;color:#222;margin:0;font-size:10pt;line-height:1.17}header{text-align:center;margin:0 0 9px}h1{font-size:17pt;margin:0 0 3px;line-height:1.05}header .contact{font-size:9.5pt}section{margin-top:7px}h2{font-size:11.5pt;line-height:1;border-bottom:.35pt solid #333;margin:0 0 3px;padding-bottom:2px}.group{margin:0 0 5px}.entry{display:flex;justify-content:space-between;gap:14px;margin:0}.entry span:last-child{text-align:right;white-space:nowrap}.entry.primary{font-weight:700}.entry.secondary{font-style:italic}.bullet{padding-left:10px;text-indent:-7px;margin:2px 0}.group .bullet:first-of-type{margin-top:3px}</style></head><body><header><h1>${htmlEscape(r.fullName || 'YOUR NAME')}</h1><div class="contact">${contact}</div></header>${r.summary?resumeSection(r.summaryTitle??'PROFILE',r.summary):''}${resumeSection(r.educationTitle??'EDUCATION',r.education)}${resumeSection(r.experienceTitle??'INTERNSHIP EXPERIENCES',r.experience)}${resumeSection(r.projectsTitle??'SELECTED PROJECTS',r.projects)}${resumeSection(r.activitiesTitle??'EXTRACURRICULAR ACTIVITIES',r.activities)}${resumeSection(r.awardsTitle??'HONORS & AWARDS',r.awards)}${resumeSection(r.skillsTitle??'SKILLS',r.skills)}</body></html>`;
}
function rtfEscape(value) {
  return String(value || '').replace(/[\\{}]/g, '\\$&').replace(/\r?\n/g, '\\line ').replace(/[^\x00-\x7F]/g, c => { const n=c.charCodeAt(0); return `\\u${n>32767?n-65536:n}?`; });
}
function resumeRtf(r) {
  const sections = [[r.summaryTitle??'PROFILE',r.summary],[r.educationTitle??'EDUCATION',r.education],[r.experienceTitle??'INTERNSHIP EXPERIENCES',r.experience],[r.projectsTitle??'SELECTED PROJECTS',r.projects],[r.activitiesTitle??'EXTRACURRICULAR ACTIVITIES',r.activities],[r.awardsTitle??'HONORS & AWARDS',r.awards],[r.skillsTitle??'SKILLS',r.skills]].filter(x=>String(x[1]||'').trim());
  const contact=[r.location,r.phone,r.email,r.linkedin,r.portfolio].filter(Boolean).join('  |  ');
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\paperw12240\\paperh15840\\margl720\\margr720\\margt620\\margb620\\fs20\\sl234\\slmult1\\qc\\b\\fs34 ${rtfEscape(r.fullName||'YOUR NAME')}\\b0\\fs19\\line ${rtfEscape(contact)}\\par\\ql ${sections.map(([title,content])=>`${String(title||'').trim()?`\\sb120\\sa35\\b\\fs23 ${rtfEscape(title)}\\b0\\fs20\\brdrb\\brdrs\\brdrw5\\par`:''}\\sb35\\brdrnone ${rtfEscape(content)}\\par`).join('')}}`;
}
async function loadPrintableHtml(win, html) {
  await win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
  await win.webContents.executeJavaScript(`document.open();document.write(${JSON.stringify(html)});document.close();`);
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
ipcMain.handle('export-resume-pdf', async (_event, resume) => {
  const result = await dialog.showSaveDialog({ defaultPath: `${safeFileName(resume.versionName)}.pdf`, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  await loadPrintableHtml(win, resumeHtml(resume));
  const pdf = await win.webContents.printToPDF({ pageSize: 'Letter', printBackground: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  fs.writeFileSync(result.filePath, pdf); win.destroy();
  return { canceled: false, path: result.filePath };
});
ipcMain.handle('export-resume-word', async (_event, resume) => {
  const result = await dialog.showSaveDialog({ defaultPath: `${safeFileName(resume.versionName)}.rtf`, filters: [{ name: 'Microsoft Word compatible', extensions: ['rtf'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.writeFileSync(result.filePath, resumeRtf(resume), 'utf8');
  return { canceled: false, path: result.filePath };
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
  if (process.env.CAREER_ATLAS_QA_HTML && process.env.CAREER_ATLAS_QA_PDF) {
    const qa = new BrowserWindow({ show: false });
    loadPrintableHtml(qa, fs.readFileSync(process.env.CAREER_ATLAS_QA_HTML, 'utf8')).then(async () => {
      const pdf = await qa.webContents.printToPDF({ pageSize: 'Letter', printBackground: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      fs.writeFileSync(process.env.CAREER_ATLAS_QA_PDF, pdf);
      qa.destroy();
      app.quit();
    });
    return;
  }
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
