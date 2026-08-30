const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/app.js', 'utf8');
const loadSource = source.slice(source.indexOf('function load()'), source.indexOf('function save()'));
const imported = [{ id: 'plan-imported', title: 'Imported plan survives restart' }];
const storage = new Map([['career-atlas-v1', JSON.stringify({ tasks: imported })]]);
const context = {
  structuredClone,
  Date,
  console,
  initialData: { tasks: [{ id: 'default-plan' }] },
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  }
};

vm.runInNewContext(`const STORAGE_KEY='career-atlas-v1';${loadSource};globalThis.result=load().tasks`, context);
assert.deepEqual(JSON.parse(JSON.stringify(context.result)), imported);
assert.match(source, /⇩ 导入计划/);
assert.match(source, /⇧ 导出计划/);
console.log('Imported tasks persist across restart and arrows are correct.');
