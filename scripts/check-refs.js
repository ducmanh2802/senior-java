#!/usr/bin/env node
/* Scan repo for remaining AI-provider references (non-readable; just report presence). */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SKIP = /\\logs[\\/]/;
const PATTERNS = ['anthropic', 'openai', 'claude', 'openrouter', 'bedrock', 'vertex', '@anthropic-ai/sdk'];
let found = false;
function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && !SKIP.test(p)) {
      const ext = path.extname(p);
      if (['.js', '.json', '.mjs', '.cjs', '.md', '.txt', '.sh', '.py'].includes(ext)) {
        let s;
        try { s = fs.readFileSync(p, 'utf8'); } catch (e) { continue; }
        for (const pat of PATTERNS) {
          if (s.match(new RegExp(pat, 'i'))) {
            found = true;
            console.log(p + '  <<<  <<<  ' + pat);
          }
        }
      }
    }
  }
}
walk(ROOT);
if (!found) console.log('No remaining AI-provider references found (excluding logs).');
