#!/usr/bin/env bash
# Ideas: when the queue runs dry, a planner agent writes the next batch of tasks so work never stops.
#   scripts/ideas.sh >> logs-runner.txt 2>&1 &      (checks every $EVERY seconds, default 900)
# A round runs only when no task is TODO and nothing is DONE-but-uncommitted, at most $MAX_ROUNDS per day.
# The planner may only create new tasks/T<n>-*.md files (Status: TODO); generic workers (worker.sh without
# ONLY) pick them up, and autopilot reviews + verifies + commits the results as usual.
cd "$(dirname "$0")/.."
EVERY=${EVERY:-900}; MAX_ROUNDS=${MAX_ROUNDS:-3}; PLANNER=${PLANNER:-codex}; BATCH=${BATCH:-6}
log() { echo "[$(date +%T)] ideas: $*"; }
owns() { grep -m1 '^Owns:' "$1" | grep -o '`[^`]*`' | tr -d '`'; }

pending() {   # a TODO task, or a finished one whose files are still uncommitted
  local f; for f in tasks/T*.md; do
    grep -q '^Status: TODO' "$f" && return 0
    grep -q '^Verify-failed:' "$f" && continue
    for o in $(owns "$f"); do [ -n "$(git status --porcelain -- "$o")" ] && return 0; done
  done; return 1
}

log "started (every ${EVERY}s, planner ${PLANNER}, ${MAX_ROUNDS} rounds/day, batch ${BATCH})"
while true; do
  day=$(date +%F); stamp="logs/ideas-$day.count"
  rounds=$(cat "$stamp" 2>/dev/null || echo 0)
  if [ "$rounds" -lt "$MAX_ROUNDS" ] && ! pending; then
    next=$(( $(ls tasks/T*.md | sed 's#.*/T\([0-9]*\).*#\1#' | sort -n | tail -1) + 1 ))
    validate=$(node scripts/validate.js 2>&1 | head -40)
    titles=$(for f in tasks/T*.md; do head -1 "$f"; done | grep -v 'R — Fact-check' | tail -60)
    prompt="Bạn là planner của dự án ôn phỏng vấn Senior Java (người học nhắm tới ngân hàng / big tech Việt Nam trong 6 tháng).
Đọc AGENTS.md, docs/PLAN-v3.md và vài file task gần nhất trong tasks/ để nắm định dạng.
Thống kê nội dung hiện tại (node scripts/validate.js):
$validate

Các task đã có (đừng lặp lại ý):
$titles

Nhiệm vụ: tạo ĐÚNG $BATCH file task mới tasks/T$next-<slug>.md … (đánh số liên tiếp từ T$next), mỗi file theo đúng định dạng:
dòng 1 '# T<n> — <tiêu đề>', dòng trống, 'Status: TODO', 'Agent: codex' (hoặc 'agy'), 'Owns: \`<file>\`[, \`<file>\`]', mô tả cụ thể (số câu/bài, danh sách ý, chuẩn chất lượng, lệnh nghiệm thu), rồi '## Nghiệm thu' và '## Notes'.
Luật bắt buộc:
- Mỗi task chỉ sở hữu file ĐÃ TỒN TẠI trong js/data/ (thêm nội dung) hoặc một cặp js/views/<view>.js + css/views/<view>.css có sẵn (cải tiến tính năng). KHÔNG sở hữu js/core/*, api/*, scripts/*, index.html, AGENTS.md; KHÔNG tạo file data mới.
- Không hai task trong lô sở hữu cùng một file.
- Ưu tiên chỗ còn mỏng trong thống kê, câu hỏi hay gặp ở phỏng vấn ngân hàng/big tech VN, và cải tiến UX giúp ôn hiệu quả hơn. Nội dung phải đúng Java 17/21, Spring Boot 3, Hibernate 6.
- CHỈ tạo các file tasks/T*.md mới; không sửa hay xoá file nào khác, không chạy git, không kill tiến trình, không mở trình duyệt, không npm install."
    log "queue empty → planning T$next.. (round $((rounds+1))/$MAX_ROUNDS today)"
    before=$(git status --porcelain | grep -v '^?? tasks/T' | md5sum)
    case "$PLANNER" in
      codex) codex exec -s workspace-write --skip-git-repo-check "$prompt" > "logs/ideas-$day-$rounds.log" 2>&1 ;;
      agy)   /c/Users/Windows/AppData/Local/Microsoft/WinGet/Links/agy.exe --model "${AGY_MODEL:-claude-opus-4-6-thinking}" -p "$prompt" > "logs/ideas-$day-$rounds.log" 2>&1 ;;
    esac
    echo $((rounds+1)) > "$stamp"
    [ "$before" = "$(git status --porcelain | grep -v '^?? tasks/T' | md5sum)" ] || log "WARNING: planner touched files other than new tasks — check git status"
    made=$(git status --porcelain -- tasks | grep '^?? tasks/T' | wc -l)
    log "planner created $made new task file(s)"
    if [ "$made" -gt 0 ]; then
      new=$(git status --porcelain -- tasks | grep '^?? tasks/T' | cut -c4-)
      git add $new && git commit -q -m "Tasks: auto-planned batch from T$next (ideas.sh, $PLANNER)

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>" -- $new && git push -q && log "committed task batch"
    fi
  fi
  sleep "$EVERY"
done
