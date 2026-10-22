#!/usr/bin/env bash
# Print the free opencode models that answer right now (one per line). Free tiers hit daily limits
# and then hang silently, so the queue probes before assigning work.
#   scripts/probe-models.sh            -> e.g. "opencode/minimax-m3.1-flash-free"
CANDIDATES=${CANDIDATES:-"minimax-m3.1-flash-free nemotron-3-ultra-free deepseek-v4.1-flash-free glm-5.3-flash-free mimo-v2.6-flash-free"}
dir=$(mktemp -d)
for m in $CANDIDATES; do
  ( timeout "${PROBE_TIMEOUT:-75}" opencode run -m "opencode/$m" "Reply with exactly: PONG" 2>/dev/null | grep -q PONG && touch "$dir/$m" ) &
done
wait
for m in $CANDIDATES; do [ -f "$dir/$m" ] && echo "opencode/$m"; done
rm -rf "$dir"
