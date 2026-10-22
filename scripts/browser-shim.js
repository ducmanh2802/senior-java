/*
 * Minimal browser globals so core scripts can be exercised from Node:
 *   const App = require('./scripts/browser-shim.js');   // loads js/core/app.js + ai.js
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
