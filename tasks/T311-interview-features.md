# T311 — Phỏng vấn AI: tính năng kiểm soát chất lượng + trải nghiệm

Status: DONE
Agent: opencode
Owns: `js/views/interview.js`, `css/views/interview.css`
After: T309

Đọc AGENTS.md mục 9, 11 và 15 trước. Chỉ dùng API `App.ai.interview.*` và `App.ui.*`. Không gọi fetch trực tiếp, không gọi AI tự động.

1. **Minh bạch chất lượng:**
   - Hiển thị model đã chấm (field `model` trong response) dạng chip nhỏ.
   - Mỗi điểm `last_answer` và mỗi dòng `by_question` có nút "Chấm chưa đúng?". Bấm vào thì lưu cờ vào `App.store.data.aiFlags` (mảng `{id, updatedAt, kind: 'interview', question, score, model, note}`, theo quy ước mục 15) rồi gọi `App.store.save()`.
   - Trang tổng kết hiển thị cảnh báo nhẹ "Điểm do model free chấm, có thể lệch ±1", kèm số câu đã bị đánh dấu.
2. **Không mất phiên:**
   - Sau mỗi lượt, lưu `transcript`, `config`, `session_token` và thời gian vào `sessionStorage` (bọc try/catch). Vào lại `#/interview` thì hỏi "Tiếp tục phiên dở?".
   - Gặp lỗi mạng, `rate_limited` hoặc `timeout` thì hiện nút "Gửi lại" và giữ nguyên câu trả lời, không mất text đã gõ hay đã nói.
3. **Tiến độ:** thanh thời gian còn lại so với `minutes`, số câu đã trả lời trên tối đa 24, nhãn `intent` (Câu hỏi, Đào sâu, Gợi ý…).
4. **Tổng kết hữu ích hơn:**
   - Biểu đồ thanh điểm theo từng câu (div + CSS var, không dùng thư viện).
   - Badge `hire_signal` có màu (ok/warn/bad).
   - Nút "Luyện lại câu yếu" cho các câu điểm ≤ 3, điều hướng sang bank/flash theo topic.
   - Nút "Tải transcript" xuất file `.md` qua Blob + `a[download]`.
5. Phím tắt: Space bật/tắt mic, Ctrl+Enter gửi, Esc dừng đọc TTS; hiện gợi ý `<kbd>`.
6. `node --check js/views/interview.js`, `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes

Implemented all T311 requirements in `js/views/interview.js` + `css/views/interview.css`: quality transparency (model chip, flag buttons, warning + flagged count), sessionStorage resume prompt, retry on errors preserving text, progress bar/time remaining/answer count, result chart + hire_signal badge color + weak-practice + markdown download, keyboard shortcuts (Space/Esc/Ctrl+Enter). `node --check` and `validate.js` OK.
Reviewed-by: verify-only (code/UI task)
