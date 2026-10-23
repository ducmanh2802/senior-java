# T45 — View: Debug lab

Status: DONE
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
- Đã làm `js/views/labs.js` + `css/views/labs.css`: danh sách lọc theo category/level/trạng thái (kèm "Đến hạn ôn");
  card có category, level, badge trạng thái.
- Màn làm bài 2 cột (>=960px) / 1 cột mobile: artifact viewer dạng terminal có tab theo `artifacts[].name`, số dòng,
  tìm kiếm highlight bằng `App.esc`, nút Copy (có fallback `execCommand`).
- Trả lời có ô nháp `sjp.lab.<id>` (try/catch), micro `App.speech`, gợi ý từng bước, chấm AI bằng
  `App.ai.grade({question, reference: answer + rubric, topic: 'lab-<category>', level, speech})` → `App.ui.feedback`,
  xem đáp án (confirm khi chưa hết gợi ý) + rubric checklist, tự đánh giá `setStatus`, điều hướng trước/sau.
- Cleanup: dừng micro, clear timer Copy, gỡ listener + phím tắt `H`/`S`. Có empty state khi `window.LABS` rỗng hoặc id sai.
- Kiểm tra: `node --check js/views/labs.js` → OK.
- **Blocker ngoài phạm vi:** tại thời điểm kết thúc, `node scripts/validate.js` chỉ báo lỗi ở `js/data/labs-gc.js`
  (T42 đang viết dở — có backtick bên trong template literal ở scenario/answer, dòng ~144, gây `Unexpected identifier 'toByteArray'`).
  Không sửa file này vì T45 không sở hữu. Đề xuất T42 bỏ/escape backtick rồi chạy lại `node scripts/validate.js`.
  Các file của T45 không tạo lỗi nào; sau khi T42 hoàn tất cần validate lại để đạt `OK — không có lỗi.`
- Không chạy `npm run smoke` để tuân thủ luật 9 (không tự mở trình duyệt/headless); người tích hợp test UI.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
