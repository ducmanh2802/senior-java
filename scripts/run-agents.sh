#!/usr/bin/env bash
# Launch coding agents for tasks in tasks/*.md (see docs/PLAN.md).
#   scripts/run-agents.sh            -> every task whose file says "Status: TODO"
#   scripts/run-agents.sh T04 T09    -> only these tasks (any status)
# Logs: logs/<task>.log
set -u
cd "$(dirname "$0")/.."
mkdir -p logs

# task -> opencode model (cline tasks use Cline's configured default model)
declare -A MODEL=(
  [T01]=opencode/deepseek-v4.1-flash-free
  [T02]=opencode/glm-5.3-flash-free
  [T03]=opencode/minimax-m3.1-flash-free
  [T04]=opencode/mimo-v2.6-flash-free
  [T05]=opencode/deepseek-v4.1-flash-free
  [T06]=opencode/deepseek-v4.1-flash-free
  [T07]=opencode/minimax-m3.1-flash-free
  [T08]=opencode/deepseek-v4.1-flash-free
  [T12]=opencode/minimax-m3.1-flash-free
  [T14]=opencode/deepseek-v4.1-flash-free
  [T16]=opencode/glm-5.3-flash-free
  [T18]=opencode/deepseek-v4.1-flash-free
  [T19]=opencode/minimax-m3.1-flash-free
  [T20]=opencode/deepseek-v4.1-flash-free
  [T21]=opencode/mimo-v2.6-flash-free
  [T33]=opencode/minimax-m3.1-flash-free
  [T34]=opencode/glm-5.3-flash-free
  [T41]=opencode/deepseek-v4.1-flash-free
  [T42]=opencode/glm-5.3-flash-free
  [T43]=opencode/minimax-m3.1-flash-free
  [T44]=opencode/mimo-v2.6-flash-free
  [T45]=opencode/deepseek-v4.1-flash-free
)

run_task() {
  local file="$1" id agent prompt
  id="$(basename "$file" | cut -d- -f1)"
  agent="$(grep -m1 '^Agent:' "$file" | awk '{print $2}')"
  prompt="Bạn là agent thực hiện task $id của dự án này. Trước tiên hãy đọc kỹ AGENTS.md và $file. \
Sau đó thực hiện ĐẦY ĐỦ task: chỉ sửa các file mà task sở hữu, chạy 'node scripts/validate.js' tới khi OK, \
không git commit, và cuối cùng cập nhật Status: DONE kèm ghi chú vào $file. Làm việc tự động đến khi xong, không hỏi lại. Nếu file của bạn đã có nội dung từ lần chạy trước bị gián đoạn: đọc lại, giữ phần tốt, sửa lỗi cú pháp và làm tiếp phần còn thiếu. Tuân thủ tuyệt đối luật 8-9 trong AGENTS.md: không kill tiến trình theo tên, không mở trình duyệt, không npm install."
  echo "[$(date +%T)] start $id ($agent ${MODEL[$id]:-cline-free/minimax-m3.1-flash})"
  case "$agent" in
    opencode) opencode run --auto -m "${MODEL[$id]}" --title "$id" "$prompt" > "logs/$id.log" 2>&1 ;;
    cline)    cline -y -P cline-pass -m cline-free/minimax-m3.1-flash -c "$PWD" "$prompt" > "logs/$id.log" 2>&1 ;;
    *)        echo "unknown agent '$agent' in $file"; return 1 ;;
  esac
  echo "[$(date +%T)] end   $id exit=$?"
}

if [ $# -gt 0 ]; then
  files=(); for t in "$@"; do files+=(tasks/"$t"-*.md); done
else
  mapfile -t files < <(grep -l '^Status: TODO' tasks/T*.md)
fi

for f in "${files[@]}"; do run_task "$f" & sleep 2; done
wait
echo "All agents finished."; node scripts/validate.js
