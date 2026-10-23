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
cd "$tmp" || exit 1
node scripts/validate.js > validate.log 2>&1 || { tail -20 validate.log; echo "verify: validate FAILED"; exit 1; }
node scripts/test-lessons.js > lessons.log 2>&1 || { tail -20 lessons.log; echo "verify: test-lessons FAILED"; exit 1; }
node scripts/check-links.mjs > links.log 2>&1 || { grep "❌" links.log | head -10; echo "verify: broken learn-more links"; exit 1; }
out=$(timeout 300 node scripts/smoke.mjs 2>&1); code=$?
echo "$out" | tail -5
[ $code -eq 0 ] && echo "$out" | grep -q "OK — không có lỗi" || { echo "verify: smoke FAILED"; exit 1; }
echo "verify: OK"
