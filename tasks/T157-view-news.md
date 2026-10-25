# T157 — View "Tin tức mỗi sáng" (#/news)

Status: DONE
Agent: opencode
After: T156
Owns: `js/views/news.js`, `css/views/news.css`

Đọc AGENTS.md mục 2, 7 và `js/core/news.js` (`App.news.list({ days, category })` → `{ updatedAt, items[{id, category, source, title, url, summary, published}] }`, lỗi `code: 'no_server'` khi chạy file:// hoặc chưa deploy, `configured: false` khi chưa có Supabase). Stub đã gắn index.html + menu "Tin tức".

- Đầu trang: tiêu đề, "Cập nhật lúc …" (`updatedAt`), nút Làm mới. 3 tab chip: **Công nghệ** (tech) / **Tuyển dụng** (hiring) / **Engineering blog** (company) + "Tất cả"; chọn khoảng 1 / 3 / 7 ngày; ô tìm kiếm lọc theo title/summary/source; chip lọc theo nguồn.
- Danh sách nhóm theo ngày ("Hôm nay", "Hôm qua", ngày cụ thể), mỗi tin: nguồn (badge), title là link mở tab mới (`target="_blank" rel="noopener"`), summary rút gọn, giờ đăng. Tin chưa đọc in đậm; bấm vào → đánh dấu đã đọc (lưu `localStorage` key `sjp.news.read`, bọc try/catch, giữ tối đa 2000 id). Nút ☆ lưu tin (localStorage `sjp.news.saved`) + chip "Đã lưu".
- Trạng thái: đang tải (skeleton), lỗi `no_server` → "Tin tức chỉ có trên bản deploy (Vercel)", `configured: false` → hướng dẫn ngắn bật Supabase, rỗng → empty state.
- Phím tắt: `r` làm mới, `/` focus ô tìm kiếm (có `<kbd>`, dùng `App.onKey`).
- **Song ngữ:** mọi chuỗi UI qua `App.t` + `App.i18n.add({vi, en})`, `get title()`. Ngày giờ theo `App.lang` (`vi-VN` / `en-US`). Nội dung tin giữ nguyên ngôn ngữ gốc.
- Escape mọi dữ liệu bằng `App.esc()`, CSS chỉ dùng biến, selector `.view-news`, responsive 360px, dark mode. `node --check` + `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
- Implemented full news view with category tabs (tech/hiring/company/all), day range (1/3/7), search, source filter.
- Items grouped by day with "Hôm nay"/"Hôm qua" labels; unread items bold; mark-read and save/unsave with localStorage (max 2000 IDs).
- Skeleton loading, proper error handling for no_server/configured:false, empty state.
- Keyboard shortcuts: `r` refresh, `/` focus search via App.onKey.
- Full bilingual support via App.i18n, date formatting via App.lang.
- All data escaped with App.esc(), CSS uses variables with .view-news prefix, responsive to 360px, dark mode compatible.
- node --check and node scripts/validate.js both pass.
Reviewed-by: verify-only (code/UI task)
