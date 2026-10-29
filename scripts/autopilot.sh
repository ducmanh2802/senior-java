#!/usr/bin/env bash
# Autopilot: keeps content flowing to production while the integrator (Claude) is away or rate-limited.
#   scripts/autopilot.sh >> logs-runner.txt 2>&1 &      (loops every $EVERY seconds, default 600)
# Each round:
#   1. a task with "Status: DONE", uncommitted changes in its owned files and no "Reviewed-by:" line
#      gets a review task <id>R (fact-check its new content) run by $REVIEWER — up to $PARALLEL at once;
#   2. when <id>R is DONE, the original task is marked "Reviewed-by: <reviewer> (<id>R)";
#   3. a reviewed task's owned files (+ both task files) are staged alone, checked with
#      scripts/verify-staged.sh (validate + lesson exercises on the JDK + browser smoke) and,
#      only if that passes, committed and pushed (Vercel deploys on push).
# Nothing is committed without a review and a green verify. Never touches files of unfinished tasks.
cd "$(dirname "$0")/.."
EVERY=${EVERY:-600}
REVIEWER=${REVIEWER:-codex}
log() { echo "[$(date +%T)] autopilot: $*"; }

owns()  { grep -m1 '^Owns:' "$1" | grep -o '`[^`]*`' | tr -d '`'; }
dirty() { local f; for f in $(owns "$1"); do [ -n "$(git status --porcelain -- "$f")" ] && return 0; done; return 1; }
# a file also owned by an unfinished task holds that task's half-done work: never commit it.
# OPEN[file]="ids of unfinished tasks owning it", rebuilt once per round (scanning ~400 task files per check was minutes on Windows)
declare -A OPEN
scan_open() {
  OPEN=()
  local t id o
  for t in $(grep -L '^Status: DONE' tasks/T*.md); do
    id=$(basename "$t" | cut -d- -f1)
    for o in $(owns "$t"); do OPEN[$o]+=" $id"; done
  done
}
open_owner() {   # $1 = task file, $2 = task id; its own review task <id>R does not count (a dead review must not block it)
  local f t; for f in $(owns "$1"); do
    for t in ${OPEN[$f]}; do
      [ "$t" = "$2" ] || [ "$t" = "${2}R" ] || { echo "$t"; return 0; }
    done
  done; return 1
}
# $PARALLEL reviews at once, one lock per slot (holds the task id; removed when the reviewer exits, stale after 2 h).
# Slot n uses the n-th model of $REVIEW_MODELS (opencode runner) so parallel reviews don't share one free quota.
PARALLEL=${PARALLEL:-3}
PUSH_EVERY=${PUSH_EVERY:-1800}
REVIEW_FILES=${REVIEW_FILES:-js/data/(q-|lessons-|labs-|glossary-|sd-problems|quiz|drills-|path)|js/i18n/}   # files whose content needs an LLM fact-check
REVIEW_POOL=${REVIEW_POOL:-nemotron-3-ultra|glm|deepseek|mimo|minimax|inkling:free|north|xing|gemini-3-flash}   # with REVIEW_MODELS=auto; small models only translate
REVIEW_MODELS=(${REVIEW_MODELS:-opencode/glm-5.3-flash-free openrouter/nvidia/nemotron-3-ultra-550b-a55b:free openrouter/thinkingmachines/inkling:free})
fresh() { [ -f "$1" ] && [ $(( $(date +%s) - $(date -r "$1" +%s) )) -lt "$2" ]; }
free_slot() {   # prints a free slot number; the legacy single lock (logs/review.lock) still counts as busy
  local n busy=0; fresh logs/review.lock 7200 && busy=1
  for n in $(seq 1 "$PARALLEL"); do
    fresh "logs/review-$n.lock" 7200 && continue
    [ "$busy" = 1 ] && { busy=0; continue; }
    echo "$n"; return 0
  done; return 1
}
# a review counts as running when a slot holds its id or its log was written in the last 2 minutes
review_running() { grep -qx "$1" logs/review-*.lock 2>/dev/null || fresh "logs/${1}R.log" 120; }

make_review() {   # $1 = task file, $2 = task id
  local r="tasks/${2}R-review.md"
  [ -f "$r" ] && return 0
  {
    echo "# ${2}R — Fact-check nội dung mới của $2"
    echo
    echo "Status: TODO"
    echo "Agent: opencode"
    echo "Owns: $(owns "$1" | sed 's/.*/`&`/' | paste -sd, - | sed 's/,/, /g')"
    echo
    echo "Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task $2 (xem \`git diff HEAD -- <file>\`) do model free viết, CHƯA review."
    echo "Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào."
    echo "Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục."
    echo "Bài học: chạy thêm node scripts/test-lessons.js tới khi pass."
    echo
    echo "## Nghiệm thu"
    echo "node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id."
    echo
    echo "## Notes"
  } > "$r"
  log "created review task ${2}R"
}

commit_task() {   # $1 = task file, $2 = task id
  local r="tasks/${2}R-review.md" files
  files="$(owns "$1") $1 $([ -f "$r" ] && echo "$r")"
  node scripts/check-links.mjs --fix > /dev/null 2>&1   # drop dead learn-more links instead of blocking the task
  git reset -q
  git add $files
  if out=$(scripts/verify-staged.sh 2>&1); then
    git commit -q -m "Content: $2 (auto-committed after ${REVIEWER} review + verify)

$(head -1 "$1" | sed 's/^# //')

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>" -- $files && touch logs/push-pending && log "committed $2 ($(git log --oneline -1 | cut -c1-7))"
  else
    git reset -q
    log "verify FAILED for $2 — left uncommitted: $(echo "$out" | tail -3 | tr '\n' ' ')"
    echo "Verify-failed: $(date +%F\ %T)" >> "$1"
  fi
}

log "started (every ${EVERY}s, reviewer ${REVIEWER})"
while true; do
  scan_open
  for f in tasks/T*.md; do
    id=$(basename "$f" | cut -d- -f1)
    case "$id" in *R) continue ;; esac
    # ONLY_RE='-en-' limits autopilot to matching task files (e.g. while Claude edits files owned by old DONE tasks)
    [ -n "${ONLY_RE:-}" ] && ! [[ "$f" =~ $ONLY_RE ]] && continue
    grep -q '^Status: DONE$' "$f" || continue
    grep -q '^Verify-failed:' "$f" && continue
    dirty "$f" || continue
    open_owner "$f" "$id" >/dev/null && continue
    if grep -q '^Reviewed-by:' "$f"; then
      commit_task "$f" "$id"
    elif ! owns "$f" | grep -qE "$REVIEW_FILES"; then
      # code/UI task (views, css, core, api, algo with tests…): verify-staged (validate + Java tests + browser smoke)
      # checks it better than a free model reading it; only knowledge content needs an LLM fact-check
      echo "Reviewed-by: verify-only (code/UI task)" >> "$f"
      commit_task "$f" "$id"
    elif [[ "$f" == *-en-* ]]; then
      # translation chunk: no LLM review — scripts/check-i18n.js (structure, leftover Vietnamese, copied code)
      # + verify are the gate; a failing chunk goes back to TODO with the errors (at most twice)
      chunk=$(owns "$f" | sed 's#js/i18n/##; s#\.en\.js$##')
      if out=$(node scripts/check-i18n.js "$chunk" 2>&1); then
        echo "Reviewed-by: check-i18n (translation, no LLM review)" >> "$f"
        commit_task "$f" "$id"
      elif [ "$(grep -c '^check-i18n failed' "$f")" -ge 2 ]; then
        echo "Verify-failed: $(date +%F\ %T) check-i18n" >> "$f"; log "check-i18n FAILED for $id (3rd time) — left for a human"
      else
        sed -i 's/^Status: DONE$/Status: TODO/' "$f"
        { echo "check-i18n failed $(date +%F\ %T) — sửa các lỗi sau rồi chạy lại:"; echo "$out" | head -15 | sed 's/^/    /'; } >> "$f"
        log "check-i18n failed for $id — back to TODO"
      fi
    elif [ -f "tasks/${id}R-review.md" ] && grep -q '^Status: DONE' "tasks/${id}R-review.md"; then
      echo "Reviewed-by: ${REVIEWER} (${id}R)" >> "$f"
      commit_task "$f" "$id"
    elif ! review_running "$id" && slot=$(free_slot); then
      if [ "${REVIEW_MODELS[0]}" = auto ]; then   # a random live model big enough to fact-check (scripts/live-models.sh)
        model=$(scripts/live-models.sh "$REVIEW_POOL" | shuf -n1)
        [ -z "$model" ] && { log "no live review model — waiting"; continue; }
      else
        model=${REVIEW_MODELS[$(( (slot - 1) % ${#REVIEW_MODELS[@]} ))]}
      fi
      make_review "$f" "$id"
      echo "$id" > "logs/review-$slot.lock"
      log "review ${id}R in slot $slot ($model)"
      ( OPENCODE_MODEL="$model" scripts/agent-cli.sh "${id}R" "$REVIEWER" >> logs-runner.txt 2>&1; rm -f "logs/review-$slot.lock" ) &
      sleep 5
    fi
  done
  # Vercel Hobby allows ~100 deployments a day and every push deploys: push batched commits at most every $PUSH_EVERY s
  if [ -f logs/push-pending ] && ! fresh logs/last-push "$PUSH_EVERY"; then
    git push -q && { rm -f logs/push-pending; touch logs/last-push; log "pushed $(git log --oneline -1 | cut -c1-7) (batched)"; }
  fi
  sleep "$EVERY"
done
