# T140 — View "Lộ trình học" (#/path)

Status: DONE
Agent: opencode
Owns: `js/views/path.js`, `css/views/path.css`

Đọc AGENTS.md mục 2, 7 và comment schema đầu `js/data/path.js` (`window.PATH`, hiện có 2 chặng mẫu, T137 sẽ viết đủ — view phải chạy với bất kỳ số chặng nào). Xem `js/views/learn.js` để biết cách đánh dấu bài học xong (`App.store.getStatus(lessonId) === 'known'`) và URL bài học (`#/learn/<lessonId>`). File stub đã gắn sẵn vào index.html + menu.

- `#/path`: tiêu đề + thanh tiến độ tổng (số chặng xong / tổng, % bài học + câu chốt đã thuộc). Danh sách chặng nhóm theo `phase`, hiển thị dạng timeline dọc: số thứ tự, title, `weeks`, `goal` (App.md), tiến độ chặng (bài học x/y, câu chốt thuộc x/y), trạng thái **Đã xong** (mọi lesson known + ≥ 70% questions known) / **Đang học** (chặng đầu tiên chưa xong mà mọi requires đã xong) / **Chưa mở** (requires chưa xong — vẫn xem được nhưng mờ đi, có nút "Học trước vẫn được").
- Chặng "Đang học" mở sẵn; click chặng khác để mở/đóng. Bên trong: danh sách bài học (link `#/learn/<id>`, dấu ✓ khi xong, level badge, phút), danh sách câu chốt (q rút gọn + chip trạng thái `App.STATUS`, link `#/bank/<topic>`), nút "Flashcard câu chốt" → `#/flash/<topic đầu tiên>` và "Làm quiz" → `#/quiz`.
- Nút lớn "Tiếp tục học" trên đầu → bài học chưa xong đầu tiên của chặng Đang học. Phím tắt `c` = Tiếp tục (có `<kbd>`).
- Mọi dữ liệu qua `App.esc()`/`App.md()`. CSS chỉ dùng biến, selector bắt đầu `.view-path`, responsive 360px, dark mode. Không sửa file khác; đề xuất (ví dụ link từ dashboard/roadmap sang #/path) ghi vào `## Notes`.
- `node --check js/views/path.js` + `node scripts/validate.js` → OK, rồi `Status: DONE`.

- **Song ngữ (bắt buộc):** mọi chuỗi giao diện qua `App.t(key, vars)`; đăng ký từ điển ở đầu IIFE bằng `App.i18n.add({ vi: {...}, en: {...} })` (key dạng `<view>.<tên>`), `title` của view viết dạng `get title() { return App.t("<view>.title"); }`. Xem comment đầu `js/core/i18n.js`. Nội dung dữ liệu (câu hỏi, đáp án, bài học, drill) giữ nguyên, không dịch.

## Notes
- View hoàn chỉnh: timeline dọc theo `phase`, thẻ `<details>/<summary>` (mở/đóng semantic, có caret), chặng "Đang học" tự mở lại khi tiến độ đổi trừ khi người dùng tự đóng; trạng thái `done | current | ready | locked` (thêm nhãn thứ 4 "Sẵn sàng" cho chặng song song: requires xong nhưng chưa phải chặng đầu chưa xong — task chỉ liệt kê 3 trạng thái, song song cần phân biệt).
- "Học trước vẫn được": bấm mở chặng locked + bỏ mờ (`is-peeked`), ẩn luôn nút; `preventDefault` để không toggle `<details>` hai lần.
- Quy tắc chặng xong đúng spec: mọi lesson `known` + ≥ 70% câu chốt `known` (chặng không có câu chốt → điều kiện câu mặc định xong); tiến độ tổng đếm id duy nhất (Set); id không tồn tại hiển thị đúng id, không crash.
- i18n: 30 key `path.*` (vi/en) đăng ký đầu IIFE, `get title()` dùng `App.t`, mọi chuỗi UI qua `App.t`, dữ liệu giữ nguyên.
- Phím tắt `c` = Tiếp tục (`App.onKey`, có `<kbd>c</kbd>`); ẩn nút khi không còn bài học chưa xong trong chặng hiện tại.
- Đã chạy: `node --check js/views/path.js`, `node scripts/validate.js` → OK, và smoke test Node qua browser-shim (không mở trình duyệt): 46/46 pass — render vi/en, 4 trạng thái chặng, ngưỡng 60%/75% câu chốt, PATH rỗng, id lesson/question không tồn tại.
- **Đề xuất integrator** (không tự sửa file khác): thêm link nội dung sang `#/path` từ dashboard/roadmap (nav menu đã có sẵn `#/path`).
Reviewed-by: opencode (T140R)
