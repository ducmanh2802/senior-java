# T146R — Fact-check nội dung mới của T146

Status: DONE
Agent: opencode
Owns: `js/core/glossary.js`, `css/glossary.css`, `scripts/check-links.mjs`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T146 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review kỹ toàn bộ nội dung MỚI của T146 trong 3 file sở hữu. Kết luận: **không phát hiện lỗi kỹ thuật nào cần sửa** — giữ nguyên code.

Kiểm tra đã chạy:
1. `node --check js/core/glossary.js`, `node --check scripts/check-links.mjs` → pass.
2. `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo duy nhất là các câu english-055..062 ngắn — thuộc file q-english.js, không phải file của task này).
3. Test logic ngoài browser (vm + dữ liệu thật, 3 file glossary-*.js = 109 entry, 511 alias): index dựng đúng, không trùng id, không xung đột alias giữa các entry, không related đứt; regex boundary đúng (WALcode / xWAL không bị link, "Idempotency key"/"happens-before"/"MVCC"/"Mức isolation" link đúng, alias dài thắng alias ngắn tại cùng vị trí); hiệu năng ~3ms cho 20 lần quét 10KB text — đạt yêu cầu ≤5ms/khối.
4. `node scripts/check-links.mjs` trên cả 3 file glossary (my file): dist 42 link, java 36, infra 60 — tổng 138 link, 0 hỏng; chỉ 4 cảnh báo 403/405 (Cloudflare/W3.org/InfoQ chặn bot — script hoạt động đúng, không phải link chết, exit 0).
5. CSS: mọi biến dùng (`--accent --accent-soft --border --radius --radius-sm --surface --surface-2 --text --shadow`) đều tồn tại trong base.css; dark mode + 360px ổn (media query 560px); `.gl-back[hidden]` đã override `display: grid` đúng; style modal khớp `dialog.ai-settings`.
6. Tích hợp: thứ tự script trong index.html đúng (data glossary trước, app.js trước `js/core/glossary.js` nên `App` và `window.GLOSSARY` sẵn có); mọi view đều tạo `<div class="md">` mới kèm nội dung hoàn chỉnh rồi mới gắn vào DOM (không có chỗ nạp nội dung muộn vào `.md` đã flag `data-gl`), nên MutationObserver debounce 100ms bắt được hết; `SKIP` gồm `button`/`a` nên không link lồng vào chip related/refs; guard `typeof window === 'undefined'` cho phép shim Node.

Không sửa gì thêm vì: modal/dialog API (`showModal`, `close`, sự kiện `close`, fallback `open` attribute) đúng chuẩn; refs chỉ nhận https + `rel="noopener noreferrer"`; các chuỗi UI tiếng Việt, không có chữ lạ; `check-links.mjs` thêm GLOSSARY theo đúng hướng "chỉ THÊM" (kèm `__file` để `--fix` hoạt động).

Quan sát (ngoài quyền sửa — để đầu mối khác xử lý): `scripts/validate.js` hiện CHƯA kiểm schema `window.GLOSSARY` như T141 mô tả (id kebab duy nhất, body ≥ 600 ký tự, alias lowercase, related có thật…). Dữ liệu glossary hiện tại vẫn qua tay: chạy tay cho kết quả sạch (không trùng id/alias, không related đứt), nhưng khi glossary đổi nội dung nên có validate tương ứng.

