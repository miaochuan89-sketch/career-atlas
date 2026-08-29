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
function parsedItems(section) {
  const split=value=>{const parts=String(value||'').split(/\s+\|\s+/);return {title:parts.shift()||'',meta:parts.join(' | ')}};
  if (Array.isArray(section.items)) return section.items.map(x=>{const old=split(x.title);return {...x,title:old.title,meta:String(x.meta??old.meta)}}).filter(x=>String(x.title||x.meta||x.content||'').trim());
  return String(section.content||'').trim().split(/\r?\n\s*\r?\n/).filter(Boolean).map(group=>{const lines=group.split(/\r?\n/),hasTitle=lines.length>1&&!/^[•-]/.test(lines[0].trim()),head=split(hasTitle?lines.shift():'');return {...head,content:lines.join('\n')}});
}
function resumeSection(section) {
  const items=parsedItems(section); if (!items.length) return '';
  const lineHtml = (line, index, hasTitle) => {
    const clean=line.trim();
    if (/^[•-]/.test(clean)) return `<div class="bullet">• ${htmlEscape(clean.replace(/^[•-]\s*/,''))}</div>`;
    const parts=clean.split(/\s+\|\s+/), left=parts.shift(), right=parts.join(' | ');
    return `<div class="entry ${hasTitle?'secondary':index===0?'primary':''}"><span>${htmlEscape(left)}</span>${right?`<span>${htmlEscape(right)}</span>`:''}</div>`;
  };
  const titleHtml=item=>item.title||item.meta?`<div class="entry primary"><span>${htmlEscape(item.title)}</span><span>${htmlEscape(item.meta)}</span></div>`:'';
  return `<section>${String(section.title||'').trim()?`<h2>${htmlEscape(section.title)}</h2>`:''}${items.map(item=>`<div class="group">${titleHtml(item)}${String(item.content||'').split(/\r?\n/).filter(Boolean).map((line,i)=>lineHtml(line,i,!!item.title)).join('')}</div>`).join('')}</section>`;
}
function resumeSections(r) {
  if (Array.isArray(r.sections)) return r.sections.filter(s => parsedItems(s).length);
  return [[r.summaryTitle??'PROFILE',r.summary],[r.educationTitle??'EDUCATION',r.education],[r.experienceTitle??'INTERNSHIP EXPERIENCES',r.experience],[r.projectsTitle??'SELECTED PROJECTS',r.projects],[r.activitiesTitle??'EXTRACURRICULAR ACTIVITIES',r.activities],[r.awardsTitle??'HONORS & AWARDS',r.awards],[r.skillsTitle??'SKILLS',r.skills]].filter(x=>String(x[1]||'').trim()).map(([title,content])=>({title,content}));
}
function resumeDesign(r) {
  return {template:'professional',fontSize:'standard',spacing:'standard',margin:'standard',autoFit:true,...(r.design||{})};
}
function resumeLayout(r) {
  const sections=resumeSections(r), text=s=>parsedItems(s).map(x=>`${x.title}\n${x.meta}\n${x.content}`).join('\n'), chars=sections.reduce((n,s)=>n+String(s.title||'').length+text(s).length,0), lines=sections.reduce((n,s)=>n+text(s).split(/\r?\n/).length,0), score=chars+lines*28+sections.length*70;
  let layout=score<1150?{mode:'spacious',margin:.48,font:11,line:1.3,section:9,group:7,name:19,heading:12}:score<2300?{mode:'standard',margin:.43,font:10.5,line:1.22,section:7,group:5.5,name:18,heading:11.5}:score<3450?{mode:'compact',margin:.34,font:9.5,line:1.13,section:4.5,group:4,name:17,heading:10.5}:{mode:'dense',margin:.28,font:8.5,line:1.06,section:3,group:2.5,name:16,heading:9.5};
  const design=resumeDesign(r),font={small:.94,standard:1,large:1.07}[design.fontSize]||1,spacing={compact:.86,standard:1,relaxed:1.16}[design.spacing]||1,margins={narrow:.32,standard:.46,wide:.58};
  if(!design.autoFit)layout={mode:'manual',margin:.46,font:10.5,line:1.22,section:7,group:5.5,name:18,heading:11.5};
  layout={...layout,margin:margins[design.margin]||layout.margin,font:layout.font*font,line:layout.line*spacing,section:layout.section*spacing,group:layout.group*spacing,name:layout.name*font,heading:layout.heading*font};
  if(design.template==='compact')layout={...layout,font:layout.font*.96,line:layout.line*.92,section:layout.section*.84,group:layout.group*.84};
  return layout;
}
function paperSpec(paper='Letter') { return paper === 'A4' ? {name:'A4',width:8.2677,height:11.6929,twips:[11906,16838]} : {name:'Letter',width:8.5,height:11,twips:[12240,15840]}; }
function resumeHtml(r, paper='Letter') {
  const primaryContact = [r.location, r.phone, r.email].filter(Boolean).map(htmlEscape).join('  |  ');
  const webContact = [r.linkedin, r.portfolio].filter(Boolean).map(htmlEscape).join('  |  ');
  const layout=resumeLayout(r), design=resumeDesign(r), sections=resumeSections(r), page=paperSpec(paper), template=['professional','design','compact'].includes(design.template)?design.template:'professional';
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${page.name};margin:${layout.margin}in}*{box-sizing:border-box}html,body{margin:0}body{font-family:"Times New Roman",Times,serif;color:#222;font-size:${layout.font}pt;line-height:${layout.line}}@media screen{html{width:${page.width}in;min-height:${page.height}in;background:#fff}body{width:${page.width}in;min-height:${page.height}in;padding:${layout.margin}in}}header{text-align:center;margin:0 0 ${layout.section}px}h1{font-size:${layout.name}pt;margin:0 0 3px;line-height:1.05}header .contact-primary{font-size:${Math.max(7.8,layout.font-.4)}pt;line-height:1.18}header .contact-links{font-size:${Math.max(7.2,layout.font-1.4)}pt;line-height:1.16;margin-top:1.5px;color:#444;overflow-wrap:anywhere}main.fill-page{min-height:${page.height-layout.margin*2-.72}in;display:flex;flex-direction:column;justify-content:space-between}section{margin-top:${layout.section}px;break-inside:avoid}h2{font-size:${layout.heading}pt;line-height:1;border-bottom:.2pt solid #777;margin:0 0 4px;padding-bottom:2px}.group{margin:0 0 ${layout.group}px}.entry{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;margin:0}.entry span+span{text-align:right;white-space:nowrap;font-family:Arial,sans-serif;font-size:.9em;font-style:italic;font-weight:400;color:#444;font-variant-numeric:tabular-nums}.entry.primary>span:first-child{font-weight:700}.entry.secondary{font-style:italic}.bullet{padding-left:10px;text-indent:-7px;margin:${layout.mode==='dense'?0:2}px 0}.template-design{font-family:Arial,"Helvetica Neue",sans-serif;color:#17231d}.template-design header{text-align:left;border-bottom:1.2pt solid #365f4b;padding-bottom:7px}.template-design h1{letter-spacing:.02em}.template-design h2{font-family:Arial,sans-serif;color:#365f4b;letter-spacing:.11em;border-bottom:.25pt solid #aab8b0}.template-design .contact-primary,.template-design .contact-links{text-align:left}.template-compact{font-family:Arial,"Helvetica Neue",sans-serif}.template-compact header{display:grid;grid-template-columns:1fr auto;text-align:left;align-items:end;border-bottom:.45pt solid #555;padding-bottom:5px}.template-compact h1{grid-row:1/3}.template-compact .contact-primary,.template-compact .contact-links{text-align:right}.template-compact h2{font-family:Arial,sans-serif;letter-spacing:.06em}.template-compact .group{break-inside:avoid}</style></head><body class="template-${template}"><header><h1>${htmlEscape(r.fullName || 'YOUR NAME')}</h1>${primaryContact?`<div class="contact-primary">${primaryContact}</div>`:''}${webContact?`<div class="contact-links">${webContact}</div>`:''}</header><main class="${layout.mode}${design.autoFit?' fill-page':''}">${sections.map(resumeSection).join('')}</main></body></html>`;
}
function rtfEscape(value) {
  return String(value || '').replace(/[\\{}]/g, '\\$&').replace(/\r?\n/g, '\\line ').replace(/[^\x00-\x7F]/g, c => { const n=c.charCodeAt(0); return `\\u${n>32767?n-65536:n}?`; });
}
function resumeRtf(r, paper='Letter') {
  const sections = resumeSections(r), layout=resumeLayout(r), fs=Math.round(layout.font*2), heading=Math.round(layout.heading*2), name=Math.round(layout.name*2), margin=Math.round(layout.margin*1440), line=Math.round(layout.font*layout.line*24);
  const page=paperSpec(paper),design=resumeDesign(r),baseFont=design.template==='professional'?0:1;
  const primaryContact=[r.location,r.phone,r.email].filter(Boolean).join('  |  ');
  const webContact=[r.linkedin,r.portfolio].filter(Boolean).join('  |  ');
  const contactLines=`${primaryContact?`\\line ${rtfEscape(primaryContact)}`:''}${webContact?`\\line \\fs${Math.max(14,fs-3)} ${rtfEscape(webContact)}\\fs${fs}`:''}`;
  const rightTab=page.twips[0]-margin*2;
  return `{\\rtf1\\ansi\\deff${baseFont}{\\fonttbl{\\f0 Times New Roman;}{\\f1 Arial;}}\\paperw${page.twips[0]}\\paperh${page.twips[1]}\\margl${margin}\\margr${margin}\\margt${margin}\\margb${margin}\\f${baseFont}\\fs${fs}\\sl${line}\\slmult1\\qc\\b\\fs${name} ${rtfEscape(r.fullName||'YOUR NAME')}\\b0\\fs${Math.max(15,fs-1)}${contactLines}\\par\\ql ${sections.map(section=>`${String(section.title||'').trim()?`\\sb${Math.round(layout.section*20)}\\sa30\\b\\fs${heading} ${rtfEscape(section.title)}\\b0\\fs${fs}\\brdrb\\brdrs\\brdrw3\\brdrcf0\\par`:''}${parsedItems(section).map(item=>`\\sb35\\brdrnone\\tqr\\tx${rightTab} ${item.title||item.meta?`\\b ${rtfEscape(item.title)}\\b0\\tab\\f1\\i\\fs${Math.max(14,fs-2)} ${rtfEscape(item.meta)}\\i0\\f${baseFont}\\fs${fs}\\line `:''}${rtfEscape(item.content)}\\par`).join('')}`).join('')}}`;
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
ipcMain.handle('import-task-plan', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Career Atlas task plan', extensions: ['json'] }] });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0], stat = fs.statSync(filePath);
  if (stat.size > 2 * 1024 * 1024) throw new Error('Task plan file is too large');
  return { canceled: false, filePath, plan: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
});
ipcMain.handle('export-task-plan', async (_event, { filename, plan }) => {
  const result = await dialog.showSaveDialog({ defaultPath: filename, filters: [{ name: 'Career Atlas task plan', extensions: ['json'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.writeFileSync(result.filePath, JSON.stringify(plan, null, 2), 'utf8');
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
