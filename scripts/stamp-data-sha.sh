#!/usr/bin/env bash
# Pin js/core/data-base.js (DATA_SHA) to the current HEAD before a push: the deploy no longer ships js/data and
# js/i18n, the app loads them from jsDelivr at this commit. Commits only that file. Skips when HEAD already is a
# pin commit (nothing new to point at).
cd "$(dirname "$0")/.." || exit 1
f=js/core/data-base.js
git log -1 --format=%s | grep -q '^data: pin DATA_SHA' && exit 0
sha=$(git rev-parse HEAD)
sed -i "s/window.DATA_SHA = '[0-9a-f]*'/window.DATA_SHA = '$sha'/" "$f"
grep -q "$sha" "$f" || { echo "stamp-data-sha: could not write $sha into $f" >&2; exit 1; }
git commit -q -m "data: pin DATA_SHA to ${sha:0:8}" -- "$f"
