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
global.document = { addEventListener() {}, querySelectorAll() { return []; } };
global.localStorage = { getItem() { return null; }, setItem() {} };
global.location = { hash: '', protocol: 'http:' };
global.addEventListener = () => {};
global.setInterval = () => {};
require(path.join(__dirname, '..', 'js', 'core', 'app.js'));
global.App = window.App; // browsers expose window properties as globals
require(path.join(__dirname, '..', 'js', 'core', 'ai.js'));
module.exports = window.App;
