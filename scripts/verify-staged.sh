#!/usr/bin/env bash
# Validate + smoke-test exactly what is staged (git index), not the working tree — agents keep
# half-written files in the working tree, so testing it says nothing about the commit.
#   scripts/verify-staged.sh          -> exit 0 only if validate and smoke both pass
#   scripts/verify-staged.sh HEAD     -> test the last commit instead
set -o pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
if [ "${1:-}" = "HEAD" ]; then git archive HEAD | tar -x -C "$tmp"; else git checkout-index -a --prefix="$tmp/"; fi
cp -r node_modules "$tmp/" 2>/dev/null
# content-only commits (js/data, js/i18n, tasks, docs) skip link check + browser smoke: validate is the gate
ui=$(git diff --cached --name-only HEAD | grep -vE '^(js/data/|js/i18n/|tasks/|docs/|CHANGELOG)' | head -1)
cd "$tmp" || exit 1
node scripts/validate.js > validate.log 2>&1 || { tail -20 validate.log; echo "verify: validate FAILED"; exit 1; }
node scripts/test-lessons.js > lessons.log 2>&1 || { tail -20 lessons.log; echo "verify: test-lessons FAILED"; exit 1; }
# only the data files this commit changes (a full run is ~2.5 min of network calls)
[ -z "$ui" ] && { echo "verify: OK (content-only, smoke skipped)"; exit 0; }
out=$(timeout 300 node scripts/smoke.mjs 2>&1); code=$?
echo "$out" | tail -5
[ $code -eq 0 ] && echo "$out" | grep -q "OK — không có lỗi" || { echo "verify: smoke FAILED"; exit 1; }
echo "verify: OK"
