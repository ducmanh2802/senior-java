#!/usr/bin/env bash
# Auto-refill: when fewer than $MIN open worker tasks remain, move the next $BATCH task files from tasks/backlog/
# into tasks/ and list their ids in logs/only-extra (running workers pick them up without a restart).
#   bash scripts/refill.sh            # one check
#   bash scripts/refill.sh --loop     # check every $EVERY s (started by scripts/pipeline-start.sh)
# Fill the backlog with a generator script (e.g. logs/claude/work/mk-backlog.js). Empty backlog → logs a notice only.
cd "$(dirname "$0")/.." || exit 1
MIN=${MIN:-6}; BATCH=${BATCH:-8}; EVERY=${EVERY:-300}
log() { echo "[$(date +%T)] refill: $*"; }

once() {
  local open
  # open = TODO worker tasks (review tasks *R belong to autopilot; translations run last and do not count)
  # only tasks the workers actually take (listed in logs/only-extra): old legacy TODO files must not hide an empty queue
  open=$(grep -l '^Status: TODO$' tasks/T*.md 2>/dev/null | grep -v 'R-review' | xargs -r grep -L 'js/i18n/' \
    | xargs -rn1 basename | cut -d- -f1 | grep -xF -f logs/only-extra 2>/dev/null | wc -l)
  [ "$open" -ge "$MIN" ] && return 0
  local files; files=$(ls tasks/backlog/T*.md 2>/dev/null | sort -V | head -n "$BATCH")
  if [ -z "$files" ]; then
    [ -f logs/refill-empty ] || { log "queue low ($open open) and backlog EMPTY — Claude must generate more"; touch logs/refill-empty; }
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
