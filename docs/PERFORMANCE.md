# Performance: lazy data loading

## Problem
`index.html` used to load every `js/data/*.js` file (~7.8 MB) as parser-blocking `<script>` tags, so the first
paint waited for the whole question bank, lessons, quiz, labs, glossary… on every route.

## Design
- **`js/core/data-manifest.js`** (`window.DATA_MANIFEST`) is the single source of truth for data files:
  - `eager`: tiny files every screen uses (`topics`, `roadmap`, `path`); the only `js/data` tags in `index.html`.
  - `groups`: `questions`, `quiz`, `algos`, `companies`, `labs`, `lessons`, `sd`, `drills`, `glossary`, `projects`.
  - `routes`: groups each view needs before `render()` (key `view` or `view/param`, e.g. `legal/privacy` → none).
  - `prefetch`: order for idle prefetch.
- **`App.need(groups)`** (`js/core/app.js`) injects classic `<script>` tags once per group (works on `file://`),
  `async = false` so files execute in manifest order (QUESTIONS/QUIZ/GLOSSARY order unchanged) while downloading
  in parallel. A failed file is logged and its group retried on the next need. `App.hasData(groups)` is sync.
- **Router**: if the route's groups are loaded it renders synchronously exactly as before; otherwise it shows
  `<div class="route-loading">` and renders when they arrive (ignored if the user navigated away meanwhile).
  The landing route's groups start downloading as soon as `app.js` runs. After the first render, every other
  group is prefetched one per idle slot (`requestIdleCallback`, fallback `setTimeout`), so later navigation is
  instant and the service worker still ends up caching everything for offline use.
- After each group, a `datagroupload` event fires: `i18n.js` overlays English on the new items (when EN is on),
  `glossary.js` rebuilds its index and links terms. `App.questions()` appends "learn more" refs to new items only.
- `App.questions()/quiz()/algos()/lessons()/topics()` are unchanged.

## Rules for contributors
- New data file → add it to a group in `data-manifest.js` (never to `index.html`). `scripts/validate.js` fails if a
  file is missing from the manifest or if `index.html`'s data tags differ from `eager`.
- A view that starts reading another global (or `App.questions()` via a widget) → add that group to its route.
  Otherwise it renders an empty list on a cold deep link (it works after prefetch, so it is easy to miss).
- Node tools load data through the manifest: `App.loadData(['lessons'])` from `scripts/browser-shim.js`.

## Numbers (uncompressed)
| | Before | After |
|---|---|---|
| Eager (index.html + local scripts + CSS) | ~8.8 MB | ~0.8 MB (core ~100 KB, views ~560 KB, CSS ~117 KB, data 25 KB) |
| `#/quiz`, `#/algo`, `#/speak`, `#/news` cold load | ~8.8 MB | +0.1–1 MB data |
| `#/` dashboard cold load | ~8.8 MB | +~6 MB data (needs questions, lessons, algos…), loaded async after first paint |

`node scripts/check-budget.js` prints the breakdown and fails if the eager shell exceeds 900 KB or a light route
(quiz, exam, algo, speak, news, legal/privacy, legal/terms) starts awaiting heavy data. Runs in CI and `npm run check`.

## Next steps (not done)
- Views (~560 KB) could be lazy too (one script per route).
- The dashboard still needs the full question bank for SRS stats; a small generated index (id/topic/level) would
  cut it to a few hundred KB but needs a generation step that stays in sync with content.
