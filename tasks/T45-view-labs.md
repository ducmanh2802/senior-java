# T45 — View: Debug lab

Status: TODO
Agent: opencode
Owns: `js/views/labs.js`, `css/views/labs.css`

> **Ghi theo lô nhỏ.** Đọc `AGENTS.md` mục 7, 9 và **10** (schema LABS + cách chấm). Dữ liệu `window.LABS` đang được viết song song (có thể đang rỗng).

## `#/labs`: danh sách
- `.page-head` "Debug lab", giới thiệu 1 dòng: luyện chẩn đoán sự cố như Senior thật (đọc dump, log, plan).
- Chips lọc category (🧵 Thread dump, ♻️ GC & bộ nhớ, 🗄️ SQL, 🔥 Sự cố production), level, và trạng thái (dùng `App.store.getStatus`).
- Card: title, category, level, badge trạng thái. Click mở `#/labs/<id>`. Trạng thái rỗng thân thiện khi chưa có lab.

## `#/labs/<id>`: làm bài
Layout 2 cột trên desktop, 1 cột trên mobile:
- **Trái**: `App.md(scenario)`, rồi **artifact viewer**: tab theo `artifacts[].name`, nội dung trong khung kiểu terminal (font mono, cuộn được, có số dòng; escape bằng `App.esc`), ô tìm kiếm trong artifact (highlight chỗ khớp), nút "Copy".
- **Phải**: danh sách `questions`, textarea trả lời kèm 🎤 (`App.speech`), nút "Gợi ý" mở từng hint, nút **"🤖 Chấm bằng AI"** (cách gọi theo AGENTS.md mục 10) → `App.ui.feedback`, nút "Xem đáp án" (confirm nếu chưa dùng hết gợi ý) → `App.md(answer)` kèm rubric dạng checklist.
- Tự đánh giá: Đã giải / Cần ôn / Chưa giải (`App.store.setStatus(lab.id, …)`, tự lên lịch ôn lặp lại).
- Câu trả lời đang gõ lưu trong `localStorage` key `sjp.lab.<id>` (bọc try/catch).
- Điều hướng lab trước/sau. Cleanup mọi listener.

## Nghiệm thu
`node --check`, `npm run smoke` OK. Responsive tới 360px, dark mode chỉ dùng biến CSS.

## Notes
