# T188 — Dịch sang tiếng Anh: q-security (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-security-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-security.js`: **security-001, security-002, security-003, security-004, security-005, security-006, security-007**.

Viết vào `js/i18n/q-security-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-security-1.en.js` và `node scripts/check-i18n.js q-security-1` → OK, rồi `Status: DONE`.

## Notes

Đã dịch đầy đủ 7 mục (security-001…security-007) vào `js/i18n/q-security-1.en.js`: q, a, follow.
- Giữ nguyên markup ({{code}}, `###`, bảng `|`, `~~~lang`), nhãn **Summary:** và `> Senior tip:`; thuật ngữ chuyên ngành, số liệu giữ nguyên; comment tiếng Việt trong code block đã dịch.
- File cũ chỉ là skeleton lần chạy gián đoạn — đã giữ header, viết lại toàn bộ nội dung.
- Kiểm tra: `node --check` OK; `node scripts/check-i18n.js q-security-1` → "OK — 7 mục đã dịch."; `node scripts/validate.js` → "OK — không có lỗi." (các cảnh báo q-english.js có sẵn từ trước, không liên quan).
Reviewed-by: check-i18n (translation, no LLM review)
