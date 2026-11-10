# T965 — Dịch sang tiếng Anh: q-security (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-security-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-security.js`: **security-037, security-038, security-039, security-040**.

Viết vào `js/i18n/q-security-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-security-7.en.js` và `node scripts/check-i18n.js q-security-7` → OK, rồi `Status: DONE`.

## Notes

Hoàn tất dịch 4 mục security-037 (SSRF), security-038 (TLS/mTLS), security-039 (XXE), security-040 (Java deserialization) vào `js/i18n/q-security-7.en.js` qua `App.i18n.content({ q, a, follow })`, giữ markup (`**`, `{{code}}`, `###`, bảng, `~~~lang`), dịch comment trong code block sang tiếng Anh, giữ `\${}` trong yaml, không backtick, không field ngoài q/a/follow.

Verification:
- `node --check js/i18n/q-security-7.en.js` → SYNTAX_OK
- `node scripts/check-i18n.js q-security-7` → OK — 4 mục đã dịch
- `node scripts/validate.js` → OK — không có lỗi (2 cảnh báo trước đó không liên quan: q-java.js modern-033, path.js lesson-design)
Reviewed-by: check-i18n (translation, no LLM review)
