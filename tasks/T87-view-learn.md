# T87 — View: Bài học (`#/learn`)

Status: DONE
Agent: opencode
Owns: `js/views/learn.js`, `css/views/learn.css`

> **Ghi theo lô nhỏ** (≤ 120 dòng mỗi edit). Đọc AGENTS.md mục 7, 9 và **12**; dữ liệu `App.lessons()` (đã sắp theo track và order). Hiện mới có 1 bài mẫu (`lesson-collections-001`), các track khác đang được viết.

## `#/learn`: mục lục
- `.page-head` "Bài học" + 1 dòng: học lại nền tảng theo lộ trình, mỗi bài có bài tập Java tự chấm.
- Nhóm theo track (`App.topic(track)` cho icon + tên), mỗi bài: title, level, `minutes` phút, số bài tập, trạng thái (✅ đã hoàn thành khi `App.store.getStatus(lesson.id) === 'known'`, 🟡 đang học khi có ít nhất 1 bài tập pass, chưa học). Thanh `.progress` theo track. Track chưa có bài thì ẩn.
- Nút "Học tiếp" tới bài chưa hoàn thành đầu tiên.

## `#/learn/<lessonId>`: đọc bài
- Đầu trang: title, level, thời lượng, `goals` dạng checklist.
- `App.md(body)`.
- **Bài tập** (mỗi bài một card): `App.md(prompt)`, editor là `<textarea class="textarea code">` (giữ Tab = 4 dấu cách, lưu nháp `localStorage` key `sjp.lesson.<lessonId>.<i>`), nút **▶ Chạy test** (`App.ai.run(App.code.assemble(code, ex.tests))` → `App.ui.runResult(run, App.code.parse(run.stdout))`; nếu `configured === false` hoặc lỗi thì gợi ý nút AI review), nút **🤖 AI review** (`App.ai.review({title, prompt, reference: ex.reference, code, run})` → `App.ui.codeFeedback`), nút **Gợi ý** (mở từng hint), nút **Xem lời giải** (confirm nếu chưa thử chạy) → `~~~java` reference + `App.md(explain)`. Bài tập pass hết test thì lưu `App.store.setStatus(lessonId + '#' + i, 'known')`.
- **Kiểm tra nhanh** (`check`): chọn đáp án → hiện đúng/sai + `App.md(explain)`.
- Nút **"Hoàn thành bài"**: `App.store.setStatus(lesson.id, 'known')` (tự lên lịch ôn lại), `App.store.log('minutes', lesson.minutes)` không cần (minutes tự đếm). Link các câu `related` tới `#/bank/<topic>`.
- Điều hướng bài trước/sau trong cùng track. Phím tắt có `<kbd>`. Cleanup listener.

## Nghiệm thu
`node --check`, `node scripts/validate.js` OK. Responsive 360px, dark mode chỉ dùng biến CSS. Mọi dữ liệu escape bằng `App.esc` (code hiển thị trong `<pre>` phải escape).

## Notes
- Integrator viết (agent free hết suất). Test E2E với runner giả lập: hint, chạy test → lưu exercise pass, quick check, hoàn thành bài; desktop + 360px không tràn.
