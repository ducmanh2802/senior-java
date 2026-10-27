#!/usr/bin/env node
/* List <script src="js/data/..."> tags in index.html (for auditing which files are preloaded). */
'use strict';
const fs = require('fs');
const PAT = /<script[^>]+src="([^"]+)"/g;
const html = fs.readFileSync('index.html', 'utf8');
let m;
while ((m = PAT.exec(html)) !== null) {
  const src = m[1];
  if (src.startsWith('js/data/')) {
    const base = src.slice('js/data/'.length, -'.js'.length);
    console.log('data:', base);
  }
}
