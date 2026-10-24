#!/usr/bin/env bash
# Print the free models that answer right now (one per line), shared by every worker and the autopilot:
# the result of scripts/probe-models.sh is cached in logs/live-models.txt for $TTL seconds and only one
# caller refreshes it at a time. agent-cli.sh removes a model from the file when it stalls.
#   scripts/live-models.sh                 -> all live models
#   scripts/live-models.sh 'inkling|xing'  -> only those matching the regex
cd "$(dirname "$0")/.."
TTL=${TTL:-600}; FILE=logs/live-models.txt; LOCK=logs/live-models.lock
fresh() { [ -s "$FILE" ] && [ $(( $(date +%s) - $(date -r "$FILE" +%s) )) -lt "$TTL" ]; }
if ! fresh; then
  if mkdir "$LOCK" 2>/dev/null; then
    scripts/probe-models.sh > "$FILE.tmp" 2>/dev/null; mv -f "$FILE.tmp" "$FILE"; rmdir "$LOCK"
  else
    for _ in $(seq 1 24); do fresh && break; sleep 5; done        # someone else is probing
    [ -d "$LOCK" ] && [ $(( $(date +%s) - $(date -r "$LOCK" +%s) )) -gt 300 ] && rmdir "$LOCK"   # stale lock
  fi
fi
grep -E "${1:-.}" "$FILE" 2>/dev/null
