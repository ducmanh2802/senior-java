/*
 * Minimal browser globals so core scripts can be exercised from Node:
 *   const App = require('./scripts/browser-shim.js');   // loads js/core/app.js + ai.js
 * Use it from a .js file. With `node -e`, a top-level `const App = …` is a global lexical binding
 * that shadows the global App the core scripts need ("App is not defined"); name it differently there:
 *   node -e "const A = require('./scripts/browser-shim.js'); console.log(A.md('**x**'))"
 */
'use strict';
const path = require('path');
global.window = { addEventListener() {} };
global.document = { 
  addEventListener() {}, 
  querySelectorAll() { return []; },
  documentElement: { lang: '' },
  getElementById() { return null; },
  createElement() { return { src: '', onload: null, onerror: null }; },
  head: { appendChild() {} },
};
global.localStorage = { getItem() { return null; }, setItem() {} };
global.location = { hash: '', protocol: 'http:' };
global.addEventListener = () => {};
global.setInterval = () => {};

const MANIFEST = require(path.join(__dirname, '..', 'js', 'core', 'data-manifest.js'));   // sets window.DATA_MANIFEST
require(path.join(__dirname, '..', 'js', 'core', 'app.js'));
// In browser, window.App is also accessible as global App; replicate for i18n.js
global.App = global.window.App;
require(path.join(__dirname, '..', 'js', 'core', 'i18n.js'));
require(path.join(__dirname, '..', 'js', 'core', 'ai.js'));
require(path.join(__dirname, '..', 'js', 'core', 'auth.js'));
// Merge global.App (from ai.js/auth.js) into window.App (from app.js)
Object.assign(global.window.App, global.App);
// Data in Node: App.loadData(['lessons']) requires the group's files synchronously (manifest order);
// App.need/hasData behave like the browser loader but never inject <script> tags.
const loaded = new Set();
function loadData(groups) {
  for (const g of groups || Object.keys(MANIFEST.groups)) {
    if (loaded.has(g)) continue;
    if (!MANIFEST.groups[g]) throw new Error('unknown data group ' + g);
    for (const f of MANIFEST.groups[g]) require(path.join(__dirname, '..', 'js', 'data', f));
    loaded.add(g);
  }
}
Object.assign(global.window.App, {
  loadData,
  need(groups) { loadData(groups); return Promise.resolve(); },
  hasData(groups) { return (groups || []).every(g => loaded.has(g)); },
  dataFiles: MANIFEST.allFiles,
});
module.exports = global.window.App;
