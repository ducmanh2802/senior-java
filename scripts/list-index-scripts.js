#!/usr/bin/env node
/* List data files: eager ones (index.html <script> tags) and lazy groups (App.need), from js/core/data-manifest.js. */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'js', 'core', 'data-manifest.js'));
for (const f of M.eager) console.log('data:', f.replace(/\.js$/, ''), '(eager)');
for (const [g, files] of Object.entries(M.groups)) for (const f of files) console.log('data:', f.replace(/\.js$/, ''), '(lazy: ' + g + ')');
