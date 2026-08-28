const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const electron = {
  app: { disableHardwareAcceleration(){}, commandLine:{appendSwitch(){}}, setPath(){}, whenReady(){return {then(){}}}, on(){}, getVersion(){return 'test'}, getPath(){return ''}, quit(){} },
  BrowserWindow: class {}, ipcMain:{handle(){}}, dialog:{}, shell:{}
};
const context = vm.createContext({
  require:id=>id==='electron'?electron:require(id), process, console, setTimeout, fetch
});
vm.runInContext(fs.readFileSync('electron/main.cjs','utf8'), context);
const resume = {fullName:'Miaochuan Fan',location:'Los Angeles, CA',phone:'123',email:'m@example.com',design:{template:'design',fontSize:'large',spacing:'relaxed',margin:'wide',autoFit:true},sections:[{title:'EDUCATION',items:[{title:'UCLA',meta:'2026–2027',content:'Master of Science'}]}]};
context.resume = resume;
const html = vm.runInContext("resumeHtml(resume, 'A4')", context);
assert(html.includes('template-design'));
assert(html.includes('fill-page'));
assert(html.includes('margin:0.58in'));
assert(html.includes('font-family:Arial'));
console.log('resume render settings: ok');
