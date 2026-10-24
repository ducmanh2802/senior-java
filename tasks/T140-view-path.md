# T140 — View "Lộ trình học" (#/path)

Status: TODO
Agent: opencode
Owns: `js/views/path.js`, `css/views/path.css`

Đọc AGENTS.md mục 2, 7 và comment schema đầu `js/data/path.js` (`window.PATH`, hiện có 2 chặng mẫu, T137 sẽ viết đủ — view phải chạy với bất kỳ số chặng nào). Xem `js/views/learn.js` để biết cách đánh dấu bài học xong (`App.store.getStatus(lessonId) === 'known'`) và URL bài học (`#/learn/<lessonId>`). File stub đã gắn sẵn vào index.html + menu.

- `#/path`: tiêu đề + thanh tiến độ tổng (số chặng xong / tổng, % bài học + câu chốt đã thuộc). Danh sách chặng nhóm theo `phase`, hiển thị dạng timeline dọc: số thứ tự, title, `weeks`, `goal` (App.md), tiến độ chặng (bài học x/y, câu chốt thuộc x/y), trạng thái **Đã xong** (mọi lesson known + ≥ 70% questions known) / **Đang học** (chặng đầu tiên chưa xong mà mọi requires đã xong) / **Chưa mở** (requires chưa xong — vẫn xem được nhưng mờ đi, có nút "Học trước vẫn được").
- Chặng "Đang học" mở sẵn; click chặng khác để mở/đóng. Bên trong: danh sách bài học (link `#/learn/<id>`, dấu ✓ khi xong, level badge, phút), danh sách câu chốt (q rút gọn + chip trạng thái `App.STATUS`, link `#/bank/<topic>`), nút "Flashcard câu chốt" → `#/flash/<topic đầu tiên>` và "Làm quiz" → `#/quiz`.
- Nút lớn "Tiếp tục học" trên đầu → bài học chưa xong đầu tiên của chặng Đang học. Phím tắt `c` = Tiếp tục (có `<kbd>`).
- Mọi dữ liệu qua `App.esc()`/`App.md()`. CSS chỉ dùng biến, selector bắt đầu `.view-path`, responsive 360px, dark mode. Không sửa file khác; đề xuất (ví dụ link từ dashboard/roadmap sang #/path) ghi vào `## Notes`.
- `node --check js/views/path.js` + `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
