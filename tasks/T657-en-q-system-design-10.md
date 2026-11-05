# T657 — Dịch sang tiếng Anh: q-system-design (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-10.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-system-design.js`: **architecture-023, architecture-024, architecture-025, architecture-026, architecture-027, architecture-028**.

Viết vào `js/i18n/q-system-design-10.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-system-design-10.en.js` và `node scripts/check-i18n.js q-system-design-10` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 6/6 mục (architecture-023 → architecture-028) vào `js/i18n/q-system-design-10.en.js` với 3 field `q`, `a`, `follow` cho mỗi mục. File này chỉ có `q/a/follow` (không có mảng object như `exercises`/`check`).
- Giữ nguyên markup: bảng `|`, `###`, `>`, `{{code}}`, `~~~text|java|sql|seq` (4 seq block đã dịch nội dung dòng, vẫn đúng cú pháp 2–6 actor, text ≤ 60 ký tự). Code Java/SQL chỉ dịch comment tiếng Việt.
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên, heading "Pitfall production" → "### Production pitfalls".
- `\$X` trong ADR sample được escape giống bản gốc; "500.000đ" → "500,000 VND" để không còn ký tự Việt trong chuỗi.
- `node scripts/check-i18n.js q-system-design-10` → `OK — 6 mục đã dịch.` (bật cờ syntax error nếu file không parse được, đồng thời xác nhận file parse/h chạy được qua vm).
- Luật 8–9: không kill tiến trình, không mở trình duyệt, không npm install, không git commit.
- **Không sửa file ngoài quyền sở hữu — 2 lỗi hiện có thuộc agent khác, cần integrator xử lý:**
  1. `node scripts/validate.js` báo LỖI ở `js/data/lessons-autotest.js`: `lesson-autotest-006.exercises[0].hints[0]` chứa `{{new Matcher() { ... }}}` (dấu `{ }` lồng nhau). File này do nhóm task autotest (T642–T647) sở hữu.
  2. `node scripts/check-i18n.js` (chạy toàn bộ) báo `topics-1.en.js: id autotest / banking không nằm trong danh sách ids của file` — file do task khác sở hữu.
  Cả hai lỗi đều tồn tại độc lập với thay đổi của T657; chunk `q-system-design-10` sạch.
Reviewed-by: check-i18n (translation, no LLM review)
