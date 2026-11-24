#!/usr/bin/env bash
# Auto-refill: when fewer than $MIN open worker tasks remain, move the next $BATCH task files from tasks/backlog/
# into tasks/ and list their ids in logs/only-extra (running workers pick them up without a restart).
#   bash scripts/refill.sh            # one check
#   bash scripts/refill.sh --loop     # check every $EVERY s (started by scripts/pipeline-start.sh)
# Nothing movable → runs SKIP_BUSY=1 node scripts/mk-backlog.js itself (AUTOGEN=0 turns that off).
cd "$(dirname "$0")/.." || exit 1
MIN=${MIN:-6}; BATCH=${BATCH:-8}; EVERY=${EVERY:-300}
log() { echo "[$(date +%T)] refill: $*"; }

# backlog tasks whose After: dependency is already DONE/CANCELLED in HEAD (at most $BATCH, oldest first)
movable() {
  local files="" c dep depf
  for c in $(ls tasks/backlog/T*.md 2>/dev/null | sort -V); do
    dep=$(grep -m1 -o '^After: T[0-9]*' "$c" | cut -d' ' -f2)
    if [ -n "$dep" ]; then
      depf=$(git ls-tree --name-only HEAD tasks/ | grep -m1 "^tasks/$dep-")
      [ -n "$depf" ] && git show "HEAD:$depf" | grep -qE '^Status: (DONE|CANCELLED)' || continue
    fi
    files="$files $c"
    [ "$(echo $files | wc -w)" -ge "$BATCH" ] && break
  done
  echo $files
}

once() {
  local open
  # open = TODO worker tasks (review tasks *R belong to autopilot; translations run last and do not count)
  # only tasks the workers actually take (listed in logs/only-extra): old legacy TODO files must not hide an empty queue
  open=$(grep -l '^Status: TODO$' tasks/T*.md 2>/dev/null | grep -v 'R-review' | xargs -r grep -L 'js/i18n/' \
    | xargs -rn1 basename | cut -d- -f1 | grep -xF -f logs/only-extra 2>/dev/null | wc -l)
  [ "$open" -ge "$MIN" ] && return 0
  # only tasks whose After: dependency is already DONE in HEAD — moving a chained successor early makes autopilot
  # see it as an open owner of the same file and the predecessor's DONE work then never gets committed
  local files
  files=$(movable)
  if [ -z "$files" ] && [ "${AUTOGEN:-1}" = 1 ]; then
    # nothing movable: generate tasks for data files nobody owns right now (SKIP_BUSY), so they can start at once.
    # Self-limiting: a file with an open or backlog task is skipped, so the backlog never piles up on one file.
    log "queue low ($open open), nothing movable → $(SKIP_BUSY=1 BATCH=$BATCH node scripts/mk-backlog.js 2>&1 | tail -1)"
    files=$(movable)
  fi
  if [ -z "$files" ]; then
    [ -f logs/refill-empty ] || { log "queue low ($open open) and no movable backlog task ($(ls tasks/backlog/T*.md 2>/dev/null | wc -l) waiting on deps) — Claude must generate more"; touch logs/refill-empty; }
    return 0
  fi
  rm -f logs/refill-empty
  local f id moved=""
  for f in $files; do
    id=$(basename "$f" | cut -d- -f1)
    mv "$f" tasks/ && echo "$id" >> logs/only-extra && moved="$moved $id"
  done
  log "queue low ($open open) → moved$moved ($(ls tasks/backlog/T*.md 2>/dev/null | wc -l) left in backlog)"
}

if [ "${1:-}" = --loop ]; then
  log "loop started (MIN=$MIN BATCH=$BATCH every ${EVERY}s)"
  while true; do once; sleep "$EVERY"; done
else
  once
fi
