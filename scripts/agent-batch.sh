#!/usr/bin/env bash
# Run one agent CLI over MULTIPLE tasks in a single session (faster than one agent per task
# when each free-model slot is precious). Usage: agent-batch.sh "T275 T276" kilo
set -u
cd "$(dirname "$0")/.."
ids="$1"; runner="${2:-kilo}"
ids="${ids// /+OFND+}"
ordered=(); for id in ${ids//+/ }; do ordered+=("$id"); done
prompt="Bạn là agent thực hiện NHIỀU task của dự án này, theo đúng thứ tự: ${ordered[*]}. \
Với mỗi task: đọc AGENTS.md và task file tương ứng (tasks/<id>-*.md), chỉ sửa các file mà task đó sở hữu, thực hiện đầy đủ phần việc miêu tảollen \
rồi ghi `node scripts/validate.js` tới khi OK, không git commit, cuối cùng cập nhật Status: DONE kèm ghi chú vào từng task file. Anda tự chủ tiến trình, không hỏi lại. Nếu file đã có nội dung dở dang từ lần chạy trước: đọc lại, giữ phần tốt, sửa lỗi cú pháp và làm tiếp. Tuân thủ tuyệt đối luật 8-9 trong AGENTS.md: không kill tiến trình theo tên, không mở trình duyệt, không npm install."
# friendlier text without weird tokens
prompt="Bạn là agent thực hiện NHIỀU task của dự án này, theo đúng thứ tự: ${ordered[*]}. \
Với từng task: đọc AGENTS.md và file task tương ứng (tasks/<id>-*.md), chỉ sửa các file task đó sở hữu, thực hiện đầy đủ phần việc, \
chạy node scripts/validate.js tới khi OK, không git commit, rồi cập nhật Status: DONE kèm ghi chú vào từng file task. Làm từng task hết rồi mới sang task tiếp. Không hỏi lại. \
Nếu file đã có nội dung dở dang từ lần chạy trước: đọc lại, giữ phần tốt, sửa lỗi cú pháp và làm tiếp. Tuân thủ luật 8-9 trong AGENTS.md: không kill tiến trình theo tên, không mở trình duyệt, không npm install."
first="${ordered[0]}"
bak="logs/backup/batch-$(date +%Y%m%d-%H%M%S)-$first"; mkdir -p "$bak"
for id in "${ordered[@]}"; do
  file=$(ls tasks/"$id"-*.md 2>/dev/null | head -1); [ -n "$file" ] || continue
  for f in $(grep -m1 '^Owns:' "$file" | grep -o '`[^`]*`' | tr -d '`'); do [ -f "$f" ] && cp "$f" "$bak/$(basename "$f")"; done
done
echo "[$(date +%T)] start batch ${ordered[*]} ($runner)"
case "$runner" in
  kilo)   kilo run --auto -m "${KILO_MODEL:-kilo/kilo-auto/free}" --title "batch-${first}" "$prompt" > "logs/batch-${runner}-${first}.log" 2>&1 ;;
  codex)  codex ${CODEX_ARGS:-} exec -s workspace-write --skip-git-repo-check "$prompt" > "logs/batch-${runner}-${first}.log" 2>&1 ;;
  gemini) GEMINI_CLI_TRUST_WORKSPACE=true gemini -y -p "$prompt" > "logs/batch-${runner}-${first}.log" 2>&1 ;;
  *) echo "unknown runner $runner"; exit 1 ;;
esac
code=$?
echo "[$(date +%T)] end   batch ${ordered[*]} exit=$code ($runner)"
