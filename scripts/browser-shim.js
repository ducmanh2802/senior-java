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

// Minimal App stub so app.js can call App.i18n.add() before i18n.js loads
global.App = {
  LEVELS: { mid: 'Middle', senior: 'Senior', lead: 'Lead / Architect' },
  STATUS: {
    known: { label: 'Đã thuộc', cls: 'ok' },
    review: { label: 'Cần ôn', cls: 'warn' },
    unknown: { label: 'Chưa biết', cls: 'bad' },
  },
  i18n: {
    add(d) {
      for (const l of ['vi', 'en']) Object.assign(this.dict[l] || (this.dict[l] = {}), (d && d[l]) || {});
    },
    dict: { vi: {}, en: {} },
  },
};

require(path.join(__dirname, '..', 'js', 'core', 'app.js'));
require(path.join(__dirname, '..', 'js', 'core', 'i18n.js'));
require(path.join(__dirname, '..', 'js', 'core', 'ai.js'));
require(path.join(__dirname, '..', 'js', 'core', 'auth.js'));
// Merge global.App (from ai.js/auth.js) into window.App (from app.js)
Object.assign(window.App, global.App);
module.exports = window.App;
