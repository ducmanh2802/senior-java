#!/usr/bin/env bash
# Autopilot: keeps content flowing to production while the integrator (Claude) is away or rate-limited.
#   scripts/autopilot.sh >> logs-runner.txt 2>&1 &      (loops every $EVERY seconds, default 600)
# Each round:
#   1. a task with "Status: DONE", uncommitted changes in its owned files and no "Reviewed-by:" line
#      gets a review task <id>R (fact-check its new content) run by $REVIEWER (codex|kilo) — one at a time;
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
# a file also owned by an unfinished task holds that task's half-done work: never commit it
open_owner() {
  local f t; for f in $(owns "$1"); do
    for t in tasks/T*.md; do
      [ "$t" = "$1" ] && continue
      grep -q '^Status: DONE' "$t" && continue
      owns "$t" | grep -qx "$f" && { echo "$(basename "$t" | cut -d- -f1)"; return 0; }
    done
  done; return 1
}
LOCK=logs/review.lock   # one review at a time; removed when the reviewer exits (stale after 2 h)
reviewing() { [ -f "$LOCK" ] && [ $(( $(date +%s) - $(date -r "$LOCK" +%s) )) -lt 7200 ]; }

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
  git reset -q
  git add $files
  if out=$(scripts/verify-staged.sh 2>&1); then
    git commit -q -m "Content: $2 (auto-committed after ${REVIEWER} review + verify)

$(head -1 "$1" | sed 's/^# //')

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>" -- $files && git push -q && log "committed + pushed $2 ($(git log --oneline -1 | cut -c1-7))"
  else
    git reset -q
    log "verify FAILED for $2 — left uncommitted: $(echo "$out" | tail -3 | tr '\n' ' ')"
    echo "Verify-failed: $(date +%F\ %T)" >> "$1"
  fi
}

log "started (every ${EVERY}s, reviewer ${REVIEWER})"
while true; do
  for f in tasks/T*.md; do
    id=$(basename "$f" | cut -d- -f1)
    case "$id" in *R) continue ;; esac
    grep -q '^Status: DONE$' "$f" || continue
    grep -q '^Verify-failed:' "$f" && continue
    dirty "$f" || continue
    open_owner "$f" >/dev/null && continue
    if grep -q '^Reviewed-by:' "$f"; then
      commit_task "$f" "$id"
    elif [ -f "tasks/${id}R-review.md" ] && grep -q '^Status: DONE' "tasks/${id}R-review.md"; then
      echo "Reviewed-by: ${REVIEWER} (${id}R)" >> "$f"
      commit_task "$f" "$id"
    elif ! reviewing; then
      make_review "$f" "$id"
      touch "$LOCK"
      ( scripts/agent-cli.sh "${id}R" "$REVIEWER" >> logs-runner.txt 2>&1; rm -f "$LOCK" ) &
      sleep 5
    fi
  done
  sleep "$EVERY"
done
