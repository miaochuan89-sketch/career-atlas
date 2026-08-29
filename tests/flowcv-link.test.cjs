const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('src/app.js', 'utf8');
const preload = fs.readFileSync('electron/preload.cjs', 'utf8');

assert.match(app, /\['flowcv','↗','FlowCV 简历'\]/);
assert.match(app, /openExternal\('https:\/\/app\.flowcv\.com\/resumes'\)/);
assert.doesNotMatch(preload, /exportResume|renderResume/);

console.log('FlowCV shortcut is configured and the legacy resume bridge is not exposed.');
