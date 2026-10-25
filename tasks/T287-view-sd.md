# T287 — View "Luyện System Design" (#/sd) bấm giờ từng pha

Status: TODO
Agent: opencode
Owns: `js/views/sd.js`, `css/views/sd.css`

Đọc AGENTS.md mục 2, 7, 9 và comment schema đầu `js/data/sd-problems.js` (`window.SD_PROBLEMS`, có thể rỗng — view chạy với 0..n đề). Stub đã gắn index.html + menu. Xem `js/views/mock.js` (bấm giờ, ghi chú) và `js/views/labs.js` (gọi AI chấm theo rubric).
- `#/sd`: danh sách đề (lọc bank/bigtech, level, đã làm), hiện điểm lần gần nhất.
- `#/sd/<id>`: đề ở trên; thanh 5 pha với đồng hồ đếm ngược từng pha (tổng 45'), hiện `guide` của pha hiện tại; mỗi pha một textarea (nút 🎤 `App.speech` nếu hỗ trợ); "Sang pha tiếp" / tự chuyển khi hết giờ, tạm dừng. Lưu nháp `App.store.data.sdDrafts[id]` + `App.store.save()`.
- Kết thúc: nút **"AI chấm"** (chỉ khi bấm) → `App.ai.grade({ question: title + prompt, reference: reference + '\nRubric: ' + rubric.join('; '), answer: các pha ghép có tiêu đề, topic: 'design', level })`, hiển thị `App.ui.feedback`, `<span class="ai-loading">` + disable nút khi chờ, lỗi `App.ui.error`. Sau đó xem `reference` (App.md) và `followups`. Tự chấm 1–5, lưu `App.store.data.sdHistory` (`{id, at, score, ai}`), `App.store.log('mock')`.
- **Song ngữ:** chuỗi UI qua `App.t` + `App.i18n.add({vi, en})` (giữ key `sd.title`), `get title()`.
- Phím tắt `n` sang pha, `p` tạm dừng (`<kbd>`, `App.onKey`). Escape dữ liệu, CSS chỉ dùng biến, selector `.view-sd`, responsive 360px, dark mode. Cleanup interval/speech. `node --check` + `node scripts/validate.js` → OK, rồi `Status: DONE`.

- Nếu `App.ui.relatedQuestions` tồn tại (js/core/related.js, task T289): cuối trang đề hiển thị `App.ui.relatedQuestions({ ids: problem.related, topic: "design", limit: 4 })`.

## Notes
