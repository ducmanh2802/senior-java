# T664 — Dịch sang tiếng Anh: q-banking (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-banking-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-banking.js`: **banking-021, banking-022**.

Viết vào `js/i18n/q-banking-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-banking-4.en.js` và `node scripts/check-i18n.js q-banking-4` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `banking-021` (service boundaries / ledger / saga + outbox) và `banking-022` (SLA-SLO-RTO-RPO, active-passive 2 DC) sang `js/i18n/q-banking-4.en.js`, phủ 3 field `q`, `a`, `follow`.
- Giữ nguyên toàn bộ markup: 2 code block mỗi mục (`~~~seq` + `~~~sql` cho 021, `~~~java` + `~~~seq` cho 022), bảng, danh sách, `> Senior tip:` giữ nguyên nhãn, `**Tóm tắt:**` → `**Summary:**`, `> Cụm từ:` → `> Terms:` (theo khuôn q-banking-1/2/3). Comment trong `~~~sql` và `~~~java`, nhãn actor/message trong `~~~seq` đều đã dịch sang tiếng Anh (check-i18n bắt lỗi tiếng Việt trong code block).
- Không chép `tags`; không backtick, không `${` trong value.
- `node scripts/check-i18n.js q-banking-4` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ cảnh báo cũ về lesson-jpa/db/sql… không nằm trong PATH, không liên quan task này).
- File đã nằm trong `js/i18n/manifest.js` (`'q-banking-4'`), không cần đăng ký thêm.
- `node --check js/i18n/q-banking-4.en.js` bị chặn theo permission shell ở phiên này, nhưng check-i18n chạy file bằng `vm.runInNewContext` và in OK — chứng tỏ file parse và execute hợp lệ.

Reviewed-by: check-i18n (translation, no LLM review)
