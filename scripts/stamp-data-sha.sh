#!/usr/bin/env bash
# Pin js/core/data-base.js (DATA_SHA) before a push: the deploy no longer ships js/data and js/i18n, the app loads
# them from jsDelivr at DATA_SHA. Pins the commit of the PREVIOUS push (origin/main), which scripts/warm-cdn.sh has
# already warmed in the background: a brand-new commit answers 403 on jsDelivr for many files for ~15 min
# (2026-11-24). Content on the site therefore lags one push batch (~40 min). Commits only that file.
cd "$(dirname "$0")/.." || exit 1
f=js/core/data-base.js
sha=$(git rev-parse origin/main) || exit 1
grep -q "$sha" "$f" && exit 0
sed -i "s/window.DATA_SHA = '[0-9a-f]*'/window.DATA_SHA = '$sha'/" "$f"
grep -q "$sha" "$f" || { echo "stamp-data-sha: could not write $sha into $f" >&2; exit 1; }
git commit -q -m "data: pin DATA_SHA to ${sha:0:8} (previous push, warmed)" -- "$f"
