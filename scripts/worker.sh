#!/usr/bin/env bash
# Long-running worker: keeps taking TODO tasks and running them on one agent CLI, waiting out
# rate limits instead of stopping. Pair it with scripts/autopilot.sh (review → verify → commit).
#   scripts/worker.sh codex >> logs-runner.txt 2>&1 &
#   scripts/worker.sh kilo  >> logs-runner.txt 2>&1 &
# A task is taken when its file says "Status: TODO", no other worker holds logs/claim/<id>, and no
# unfinished task with an "After:" dependency blocks it. If a run ends with the task still TODO
# (limit hit, crash), the claim is released and the worker sleeps $BACKOFF seconds before retrying.
cd "$(dirname "$0")/.."
runner="${1:-codex}"; BACKOFF=${BACKOFF:-1800}; ONLY="${ONLY:-}"   # ONLY="T90 T91" to restrict
mkdir -p logs/claim
log() { echo "[$(date +%T)] worker-$runner: $*"; }

next_task() {
  local f id dep
  for f in tasks/T*.md; do
    id=$(basename "$f" | cut -d- -f1)
    case "$id" in *R) continue ;; esac                       # review tasks belong to autopilot
    [ -n "$ONLY" ] && ! echo " $ONLY " | grep -q " $id " && continue
    grep -q '^Status: TODO$' "$f" || continue
    dep=$(grep -m1 '^After:' "$f" | awk '{print $2}')
    [ -n "$dep" ] && ! grep -q '^Status: DONE' tasks/"$dep"-*.md 2>/dev/null && continue
    mkdir "logs/claim/$id" 2>/dev/null || continue           # atomic claim
    echo "$id"; return 0
  done
  return 1
}

log "started (backoff ${BACKOFF}s${ONLY:+, only: $ONLY})"
while true; do
  if id=$(next_task); then
    scripts/agent-cli.sh "$id" "$runner"
    if grep -q '^Status: TODO$' tasks/"$id"-*.md; then
      rmdir "logs/claim/$id"; log "$id still TODO (limit or crash) — retry in ${BACKOFF}s"; sleep "$BACKOFF"
    else
      rmdir "logs/claim/$id"; log "$id finished"
    fi
  else
    sleep 600                                                 # nothing to do: look again later
  fi
done
