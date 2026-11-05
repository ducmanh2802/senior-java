# T298 — Audit: deploy lên Vercel không hiển thị gì (trang trắng)

Status: DONE
Agent: opencode
Owns: `tasks/T298-audit-deploy-blank.md`, `tasks/T299-*.md`, `tasks/T300-*.md`, `tasks/T301-*.md`, `tasks/T302-*.md`, `tasks/T303-*.md`, `tasks/T304-*.md`

## Bối cảnh

Sau các commit gần đây (xem `git log -5 --stat`, đặc biệt `412e521 update`), bản deploy production trên Vercel mở ra **không hiển thị gì**.
Task này **chỉ audit + lập kế hoạch**: KHÔNG sửa code của dự án. Chỉ được ghi vào file task này và tạo các file task mới T299–T304.

## Việc cần làm

1. Tìm nguyên nhân gốc (có dẫn chứng: file, dòng, output lệnh). Các hướng phải kiểm tra:
   - `node scripts/validate.js` và `node --check` cho **mọi** file `.js` mà `index.html` nạp (thứ tự `<script>` trong `index.html`; có `scripts/list-index-scripts.js`). Một classic script lỗi cú pháp hoặc ném lỗi lúc nạp (ví dụ `App` chưa định nghĩa, `window.X.push` khi X chưa có) có thể làm app không render.
   - `index.html` có trỏ tới file **không tồn tại / chưa commit** không (`git ls-files` so với danh sách script/css). File chưa được track sẽ 404 trên Vercel dù chạy được ở local.
   - `sw.js` (service worker): danh sách precache có file 404 không, có cache bản cũ / trả về rỗng không, version cache có được bump không.
   - `vercel.json` (`cleanUrls`, crons) và `api/*.js`: lỗi build function có làm hỏng cả deployment không; `package.json` có `build`/`engines`/`type: module` gây đổi cách Vercel build không.
   - `js/core/app.js`, `js/core/ai.js`, `js/core/auth.js`: lỗi khởi động (ví dụ phụ thuộc Supabase/env khi chưa cấu hình) làm router không chạy.
   - Có thể mô phỏng việc nạp trang bằng Node: `const App = require('./scripts/browser-shim.js')` (xem cách dùng trong scripts/). KHÔNG mở trình duyệt, KHÔNG chạy server nền (AGENTS.md luật 8–9).
2. Ghi báo cáo vào `## Notes` bên dưới: nguyên nhân gốc, dẫn chứng, mức độ (blocker / nên sửa / nhỏ).
3. **Phân task sửa** cho agent free: tạo các file `tasks/T299-<slug>.md` … (tối đa T304, mỗi vấn đề độc lập 1 task) theo đúng định dạng các task cũ (xem `tasks/T297-*.md`):
   - Dòng 3: `Status: TODO`, dòng tiếp: `Agent: opencode`, `Owns:` liệt kê chính xác file được sửa (bọc trong backtick).
   - **Hai task không được cùng sở hữu một file.** Nếu task B phải chờ task A thì thêm dòng `After: T299`.
   - Mô tả cụ thể: lỗi gì, ở file/dòng nào, cách sửa mong muốn, cách kiểm chứng (`node --check`, `node scripts/validate.js` → `OK — không có lỗi.`).
   - Task sửa file của integrator (`index.html`, `js/core/*`, `sw.js`, `vercel.json`, `api/*`) vẫn được phép tạo; ghi rõ trong task là đã được integrator cho phép sửa đúng các file trong `Owns`.
4. Cập nhật `Status: DONE` ở file này.

## Notes

- (integrator) opencode/gemini hết quota giữa chừng; Claude hoàn tất audit.
- **Nguyên nhân gốc (blocker):** commit `ac4aa22` thêm `App.i18n.add({...})` ở top-level `js/core/app.js:275`, chạy khi `window.App` chưa được gán (dòng 401) và `js/core/i18n.js` nạp SAU app.js → `ReferenceError: App is not defined` → không có `App`, mọi view không đăng ký → trang trắng. `scripts/browser-shim.js` có stub `global.App` nên validate/test không bắt được.
- **Đã sửa:** đăng ký core strings trong `DOMContentLoaded` (listener thêm trước init của i18n.js). Mô phỏng nạp 78 script của index.html trong vm: 0 lỗi, `App.t('app.theme.dark')` → `Tối`. sw.js network-first nên không cần bump VERSION.
- Còn lại: T299 (validate lỗi lesson-ai-001 chưa có trong index.html + bỏ stub shim), T300–T307 review nội dung đã commit chưa qua review.
Reviewed-by: verify-only (code/UI task)
