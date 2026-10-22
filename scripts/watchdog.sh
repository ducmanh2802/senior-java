#!/usr/bin/env bash
# Stall watchdog for opencode agents (Windows / Git Bash).
#   STALL=900 scripts/watchdog.sh &
# Every minute: an agent process (opencode … --title Txx) whose logs/Txx.log has not changed for
# $STALL seconds is stopped BY PID (never by name — other tools use node/opencode too) and started
# again through scripts/run-agents.sh, at most $RETRIES times per task. The agent prompt tells it to
# continue partial work. Events go to stdout (append to logs-runner.txt).
# Before a retry the free models are probed again (scripts/probe-models.sh) so the retry lands on one that answers.
cd "$(dirname "$0")/.."
STALL=${STALL:-900}
RETRIES=${RETRIES:-2}
declare -A tries=()

agents() {  # lines: "<pid> <task>" for opencode.exe processes started by run-agents.sh
  powershell.exe -NoProfile -Command \
    "Get-CimInstance Win32_Process -Filter \"Name='opencode.exe'\" | ForEach-Object { if (\$_.CommandLine -match '--title (T\d+)') { '{0} {1}' -f \$_.ProcessId, \$matches[1] } }" \
    2>/dev/null | tr -d '\r'
}

echo "[$(date +%T)] watchdog: stall ${STALL}s, retries ${RETRIES}"
while true; do
  now=$(date +%s)
  while read -r pid task; do
    [ -n "$task" ] || continue
    log="logs/$task.log"
    [ -f "$log" ] || continue
    idle=$(( now - $(date -r "$log" +%s) ))
    [ "$idle" -ge "$STALL" ] || continue
    grep -q '^Status: DONE' tasks/"$task"-*.md && continue
    n=${tries[$task]:-0}
    echo "[$(date +%T)] stalled $task (pid $pid, idle ${idle}s) — stopping"
    powershell.exe -NoProfile -Command "Stop-Process -Id $pid -Force" >/dev/null 2>&1
    if [ "$n" -lt "$RETRIES" ]; then
      tries[$task]=$((n + 1))
      echo "[$(date +%T)] retry $task ($((n + 1))/$RETRIES)"
      cp "$log" "logs/$task.stall$((n + 1)).log"
      ( sleep 30; FORCE_MODELS="$(scripts/probe-models.sh | tr '\n' ' ')" scripts/run-agents.sh "$task" ) &
    else
      echo "[$(date +%T)] giving up on $task after $RETRIES retries"
    fi
  done < <(agents)
  sleep 60
done
