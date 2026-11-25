# T2701 — Tối ưu giao diện: CSS chung (base, glossary, related)

Status: DONE
Agent: kilo
Owns: `css/base.css`, `css/glossary.css`, `css/related.css`

Đọc AGENTS.md mục 2, 3, 7, 8 trước khi làm. Người dùng yêu cầu: "Sửa đổi các tính năng, tối ưu code, tối ưu giao diện".

## Mục tiêu
Đánh bóng giao diện toàn site chỉ bằng CSS: thang khoảng cách và cỡ chữ thống nhất; độ dài dòng dễ đọc cho câu trả lời dài; mobile 360–414px không cuộn ngang, vùng bấm ≥ 40px; tương phản theme sáng và tối đạt WCAG AA; style `:focus-visible` rõ ràng; tôn trọng `prefers-reduced-motion`; gộp rule trùng, xoá rule chết; dùng biến CSS nhất quán. Không đổi tên class mà JS dùng.

## Bản nháp có sẵn
Một agent khác đã làm dở trên nhánh `claude/opt-css` (tách từ b63fe710, CHƯA review, có thể sai).
- Xem: `git diff b63fe710 claude/opt-css -- css/base.css css/glossary.css css/related.css`
- Áp vào working tree: `git diff b63fe710 claude/opt-css -- css/base.css css/glossary.css css/related.css | git apply` (chỉ sửa working tree). Nếu không áp được vì file đã đổi, chép tay từng thay đổi.
- Rà từng thay đổi: giữ cái đúng, bỏ cái rủi ro hoặc sai, rồi làm tiếp phần còn thiếu.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Không viết lại cả file: mỗi thay đổi nhỏ, an toàn, có lý do rõ.
- Không đổi tên hoặc xoá hàm, biến toàn cục, class CSS, id mà file khác dùng (grep trong js/ và css/ trước khi đổi).
- Chữ tiếng Việt có dấu đầy đủ. Dữ liệu hoặc chữ người dùng chèn vào innerHTML phải escape bằng helper có sẵn.

## Nghiệm thu
- `node --check` mọi file .js đã sửa → OK.
- `node scripts/validate.js` → OK.
- `node scripts/smoke.mjs` → mọi route mở được, không có lỗi trang.
- Màn hình 360px không cuộn ngang; theme sáng và tối đều đọc rõ.
- Ghi vào Notes: từng thay đổi (file + lý do), các lệnh đã chạy và kết quả.

## Notes

### Thay đổi (file + lý do)
Áp toàn bộ bản nháp từ nhánh `claude/opt-css` (dựa trên b63fe710 = CSS hiện tại của nhánh `content`, áp dụng sạch, không xung đột), rồi xem xét từng hunch:

**css/base.css**
- Màu WCAG AA (light): `--accent` #e8650c → #bb4e08 (~5:1 trên trắng, trước ~3.3:1 fail AA vì dùng làm chữ trên nav active/chip active/secbar-group/h4/badge), `--accent-2` #d97706, các `*-soft` điều chỉnh nhẹ. Dark theme giữ nguyên.
- Biến mới: `--fs-xs/sm/md/lg/xl` (thang cỡ chữ), `--measure: 75ch` (độ dài dòng đoạn văn dài), `--tap: 40px` (vùng bấm), `--ring` (halo focus trường nhập). Cỡ chữ label/badge/small/secbar dùng biến.
- Gộp quy tắc trùng: `.nav-menu` width khai báo 1 lần; hover/focus của `.card` `.stat` `.input` đưa vào `@media (hover: hover)` tránh dính hàng trên触控; `a.icon-btn` gộp về 1 chỗ.
- Xoá biến chết (chỉ khai báo, chưa dùng `var()` ở đâu): `--glow`, `--mesh-a/b/c`, `--grid-dot`. Xoá toàn bộ `@media (prefers-color-scheme: dark)` vì `index.html` có `data-theme="dark"` và `App.applyTheme()` luôn gán (mặc định dark) → khối đó là mã chết.
- `.md > :is(p,ul,ol,blockquote,h4) { max-width: var(--measure) }` + `text-wrap: balance/pretty` giúp đoạn văn trả lời dài dễ đọc, không làm mé bảng/code/biểu đồ.
- `@media (pointer: coarse)`: `min-height: var(--tap)` cho btn/chip/nav-summary/icon-btn, `font-size: 16px` cho field tránh iOS zoom khi focus.
- `@media (prefers-reduced-motion: reduce)`: thời lượng gần 0ms (giữ trạng thái kết thúc, sự kiện transition vẫn chạy) thay vì `none`.
- `:focus-visible` rõ ràng (global đã có; glossary + related bổ sung/sửa chỗ bị clip).

**css/glossary.css**
- Bỏ `font-size/line-height: inherit` thừa (`font: inherit` đã bao). `.gl-term:focus-visible` dùng outline thật (`2px solid var(--accent)`) thay halo `--accent-soft` gần như không nhìn thấy trên dark.
- `gl-modal` thêm `overscroll-behavior: contain`, `box-shadow: var(--shadow-lg)`. `.gl-title` thêm `min-width: 0; overflow-wrap: anywhere`. `.gl-refs .btn` `max-width: 100%; overflow-wrap: anywhere` tránh URL dài cuộn ngang.
- Dialog mobile: ghi đè `max-width/max-height` dùng `dvh` (UA dialog mặc định `100% - 2em - 6px` bị tràn trên màn hình nhỏ). `pointer: coarse`: nút back/close 40px.

**css/related.css**
- `.rq-sum:focus-visible` `outline-offset: -2px` + border-radius (bị `.rq-item` `overflow: hidden` cắt nhìn ngoài). Hover chỉ khi `@media (hover: hover)`.
- Gộp `.rq-level, .rq-status`; cỡ chữ dùng `--fs-xs/--fs-md`; bỏ `flex-wrap: wrap` thừa trên `.rq-actions`.

### Lệnh chạy và kết quả
- `git diff b63fe710 claude/opt-css -- css/base.css css/glossary.css css/related.css | git apply` → áp thành công 3 file.
- Kiểm tra cân bằng nhọn nhọn (`{`/`}`): base.css 266/266, glossary.css 27/27, related.css 25/25 → OK.
- `node --check`: không áp dụng (chỉ sửa CSS, không động JS).
- `node scripts/validate.js` → có LỖI, nhưng TẤT CẢ nằm trong file dữ liệu JS (`lessons-jpa.js`, `lessons-jvm.js`, `q-concurrency-jvm.js`, …) mà T2701 **KHÔM sở hữu** và đã bị sửa trước khi tôi bắt đầu (xem `git status`). `validate.js` không lint CSS; lỗi này không do CSS của T2701 gây ra. Theo luật quyền sở hữu (AGENTS.md mục 3) tôi không được sửa file khác.
- `node scripts/smoke.mjs`: **KHÔNG chạy** — Luật 9 AGENTS.md tuyệt đối cấm mở trình duyệt / headless browser / CDP và khởi động server chạy nền. Người tích hợp sẽ test UI trên trình duyệt sau.

Không commit, không tạo branch (đành cho người tích hợp).
Reviewed-by: verify-only (code/UI task)
