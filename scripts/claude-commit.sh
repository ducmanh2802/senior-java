#!/usr/bin/env bash
# Commit specific working-tree files as the integrator (Claude) WITHOUT using the shared git index, so several
# Claude agents can commit at the same time (2026-11-11).
#   bash scripts/claude-commit.sh "<message>" <file>...
# - builds a private index = HEAD + the given files (CRLF normalised like a normal `git add`)
# - regenerates js/data/index-light.js from exactly that tree when a js/data file is included
# - runs scripts/verify-staged.sh on that tree (validate, lesson tests; smoke only for non-content files)
# - commits with compare-and-swap on the branch ref and retries when another committer won the race
# It never pushes (the integrator pushes in batches: every push is a Vercel deployment).
set -u
cd "$(dirname "$0")/.." || exit 1
[ $# -ge 2 ] || { echo "usage: bash scripts/claude-commit.sh \"<message>\" <file>..."; exit 2; }
msg=$1; shift
branch=$(git symbolic-ref -q HEAD) || { echo "claude-commit: detached HEAD"; exit 2; }
for f in "$@"; do [ -f "$f" ] || { echo "claude-commit: no such file: $f"; exit 2; }; done

for attempt in 1 2 3 4 5 6 7 8; do
  base=$(git rev-parse HEAD)
  idx=$(mktemp -u)
  export GIT_INDEX_FILE="$idx"
  git read-tree "$base" || { echo "claude-commit: read-tree failed"; exit 1; }
  data=0
  for f in "$@"; do
    mode=100644; case "$f" in *.sh) mode=100755 ;; esac
    blob=$(git hash-object -w --path="$f" -- "$f") || exit 1
    git update-index --add --cacheinfo "$mode,$blob,$f" || exit 1
    case "$f" in js/data/*) data=1 ;; esac
  done
  if git diff --cached --quiet "$base" --; then
    rm -f "$idx"; unset GIT_INDEX_FILE
    echo "claude-commit: nothing to commit (given files already equal HEAD)"; exit 0
  fi
  if [ "$data" = 1 ]; then
    tmp=$(mktemp -d)
    if git checkout-index -a --prefix="$tmp/" && (cd "$tmp" && node scripts/build-light-index.js > /dev/null 2>&1); then
      git update-index --add --cacheinfo "100644,$(git hash-object -w "$tmp/js/data/index-light.js"),js/data/index-light.js"
    fi
    case "$tmp" in /tmp/*|/var/*|/c/Users/*/AppData/Local/Temp/*) rm -rf -- "$tmp" ;; esac
  fi
  if ! out=$(scripts/verify-staged.sh 2>&1); then
    rm -f "$idx"; unset GIT_INDEX_FILE
    echo "$out" | tail -25
    echo "claude-commit: VERIFY FAILED — nothing committed. Fix the errors above (in YOUR files) and run again."
    exit 1
  fi
  tree=$(git write-tree)
  c=$(git commit-tree "$tree" -p "$base" -m "$msg

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>")
  rm -f "$idx"; unset GIT_INDEX_FILE
  if git update-ref "$branch" "$c" "$base" 2> /dev/null; then
    git reset -q 2> /dev/null || true
    echo "claude-commit: committed $(git log --oneline -1 | cut -c1-90)"
    exit 0
  fi
  echo "claude-commit: branch moved while verifying, retrying ($attempt)"
  sleep 2
done
echo "claude-commit: gave up after 8 attempts"
exit 1
