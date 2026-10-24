# T146 — Từ điển thuật ngữ: tự gạch chân từ khó + modal giải thích

Status: TODO
Agent: opencode
After: T141
Owns: `js/core/glossary.js`, `css/glossary.css`, `scripts/validate.js`, `scripts/check-links.mjs`

Người học gặp từ khó trong đáp án (ví dụ "idempotency key", "payment intent") mà không hiểu. Đọc AGENTS.md mục 2, 5, 7, 13 và comment schema đầu `js/data/glossary-dist.js` (`window.GLOSSARY`, có thể đang rỗng — code phải chạy với 0..n mục). File stub đã gắn index.html (css sau base.css, js sau auth.js, trước các view). KHÔNG sửa `js/core/app.js`, `index.html` hay view nào.

1. `js/core/glossary.js` (IIFE, classic script):
   - Dựng index alias → entry (lowercase), regex ghép các alias sắp xếp dài trước, có ranh giới từ (chữ/số không dính hai bên).
   - Dùng `MutationObserver` trên `document.body` (debounce ~100ms) để xử lý mọi phần tử `.md` mới xuất hiện (và `.md` có sẵn lúc load). Đánh dấu đã xử lý (`data-gl="1"`) để không lặp.
   - Duyệt text node bằng `TreeWalker`, BỎ QUA bên trong `code, pre, a, button, kbd, h1, h2, input, textarea, .gl-term`. Mỗi entry chỉ link **lần xuất hiện đầu tiên** trong mỗi khối `.md`. Bọc bằng `<button type="button" class="gl-term" data-gl-id="…">` giữ nguyên chữ gốc, `title` = `short`.
   - Click (delegation trên document) → mở `<dialog class="gl-modal">` dùng chung: term, short, `App.md(body)`, refs (video YouTube: nút mở link ngoài `target="_blank" rel="noopener"`, kèm `note`; không nhúng iframe), related là các nút mở entry khác ngay trong modal (có nút ← quay lại). Esc / nút ✕ / click backdrop để đóng; focus về lại từ đã bấm. Body modal cũng được gạch chân term (trừ chính nó).
   - Expose `App.glossary = { find(id), open(id), entries() }` (gắn vào `window.App` sau khi App tồn tại).
   - Hiệu năng: bỏ qua nếu GLOSSARY rỗng; không làm treo trang với đáp án dài (≤ 5ms/khối điển hình).
2. `css/glossary.css`: `.gl-term` trông như link chấm gạch chân (border-bottom dotted, màu `var(--accent)`, không đổi font/kích thước, reset style button), `.gl-modal` theo phong cách `dialog.ai-settings` trong base.css; chỉ dùng biến CSS, dark mode, responsive 360px (modal gần full màn hình trên mobile, cuộn được).
3. `scripts/validate.js` (chỉ THÊM): kiểm tra GLOSSARY — id kebab duy nhất, term/short/body bắt buộc, body ≥ 600 ký tự, aliases lowercase không trùng giữa các entry, related trỏ id có thật, refs đúng schema mục 13, không backtick.
4. `scripts/check-links.mjs` (chỉ THÊM): kiểm tra cả `refs` của GLOSSARY như refs câu hỏi.
5. `node --check` các file + `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
