#!/usr/bin/env bash
# Run agent tasks through a queue instead of all at once (free model tiers stall when too many
# sessions run in parallel).
#   MAX=4 scripts/run-queue.sh T41 T42 T46 ...   -> start in order, at most MAX at a time
# A task is held back while
#   * another queued task that owns the same file is running ("Owns:" line of the task file), or
#   * its "After: Txx" task has not ended yet (checked in logs-runner.txt, so tasks started
#     outside this queue count too).
# Each task runs via scripts/run-agents.sh, which writes logs/<task>.log and start/end lines to stdout.

cd "$(dirname "$0")/.."
MAX=${MAX:-4}
queue=("$@")
declare -A pid_of=() owns_of=()

owns()  { grep -m1 '^Owns:' tasks/"$1"-*.md | grep -o '`[^`]*`' | tr -d '`' | tr '\n' ' '; }
after() { grep -m1 '^After:' tasks/"$1"-*.md | awk '{print $2}'; }
live() {  # tasks of every opencode agent running on this machine (also ones started outside the queue)
  powershell.exe -NoProfile -Command \
    "Get-CimInstance Win32_Process -Filter \"Name='opencode.exe'\" | ForEach-Object { if (\$_.CommandLine -match '--title (T\d+)') { \$matches[1] } }" \
    2>/dev/null | tr -d '\r' | sort -u
}
busy() {
  local t f g
  for t in "${!pid_of[@]}" $(live); do for f in $(owns "$t"); do for g in $1; do [ "$f" = "$g" ] && return 0; done; done; done
  return 1
}
ready() {
  local dep; dep="$(after "$1")"
  [ -z "$dep" ] || grep -q '^Status: DONE' tasks/"$dep"-*.md || grep -q "end   $dep " logs-runner.txt 2>/dev/null
}

if [ -z "${FORCE_MODELS:-}" ]; then
  FORCE_MODELS="$(scripts/probe-models.sh | tr '\n' ' ')"
  [ -n "${FORCE_MODELS// /}" ] || { echo "[$(date +%T)] no free model answers right now"; exit 1; }
fi
export FORCE_MODELS
echo "[$(date +%T)] queue (max $MAX, models: $FORCE_MODELS): ${queue[*]}"
while [ ${#queue[@]} -gt 0 ] || [ ${#pid_of[@]} -gt 0 ]; do
  for t in "${!pid_of[@]}"; do kill -0 "${pid_of[$t]}" 2>/dev/null || unset "pid_of[$t]"; done
  if [ ${#pid_of[@]} -lt "$MAX" ]; then
    for i in "${!queue[@]}"; do
      t=${queue[$i]}; o=$(owns "$t")
      if grep -q '^Status: DONE' tasks/"$t"-*.md; then   # finished meanwhile (e.g. by a watchdog retry)
        echo "[$(date +%T)] skip $t (already DONE)"; unset "queue[$i]"; queue=("${queue[@]}"); break
      fi
      if ! busy "$o" && ready "$t"; then
        scripts/run-agents.sh "$t" & pid_of[$t]=$!; owns_of[$t]=$o
        unset "queue[$i]"; queue=("${queue[@]}")
        break
      fi
    done
  fi
  sleep 20
done
echo "[$(date +%T)] queue finished"; node scripts/validate.js | tail -3
