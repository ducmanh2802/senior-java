#!/usr/bin/env bash
# Print the free opencode models that answer right now (one per line). Free tiers hit daily limits
# and then hang silently, so the queue probes before assigning work.
#   scripts/probe-models.sh            -> e.g. "opencode/minimax-m3.1-flash-free"
CANDIDATES=${CANDIDATES:-"minimax-m3.1-flash-free nemotron-3-ultra-free deepseek-v4.1-flash-free glm-5.3-flash-free mimo-v2.6-flash-free"}
# OpenRouter free models (key via `opencode auth login`); probed 2026-10-24, gemma-4-31b / nemotron-3-super did not answer
OR_CANDIDATES=${OR_CANDIDATES:-"nvidia/nemotron-3-ultra-550b-a55b:free thinkingmachines/inkling:free cohere/north-mini-code:free"}
dir=$(mktemp -d)
for m in $CANDIDATES; do
  ( timeout "${PROBE_TIMEOUT:-75}" opencode run -m "opencode/$m" "Reply with exactly: PONG" 2>/dev/null | grep -q PONG && touch "$dir/$m" ) &
done
for m in $OR_CANDIDATES; do
  f="or-${m//\//_}"
  ( timeout "${PROBE_TIMEOUT:-75}" opencode run -m "openrouter/$m" "Reply with exactly: PONG" 2>/dev/null | grep -q PONG && touch "$dir/$f" ) &
done
# Gemini CLI has its own free quota (Gemini API key configured in ~/.gemini)
if command -v gemini >/dev/null 2>&1 && [ -n "${USE_GEMINI:-}" ]; then   # opt-in: an API key allows ~20 requests/day, an agent dies mid-file
  ( GEMINI_CLI_TRUST_WORKSPACE=true timeout "${PROBE_TIMEOUT:-75}" gemini -p "Reply with exactly: PONG" 2>/dev/null | grep -q PONG && touch "$dir/gemini" ) &
fi
wait
for m in $CANDIDATES; do [ -f "$dir/$m" ] && echo "opencode/$m"; done
for m in $OR_CANDIDATES; do [ -f "$dir/or-${m//\//_}" ] && echo "openrouter/$m"; done
[ -f "$dir/gemini" ] && echo "gemini/default"
rm -rf "$dir"
