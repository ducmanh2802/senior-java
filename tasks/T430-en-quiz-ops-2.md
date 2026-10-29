# T430 — Dịch sang tiếng Anh: quiz-ops (22 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-ops.js`: **qz-aws-018, qz-aws-019, qz-aws-020, qz-aws-021, qz-aws-022, qz-security-009, qz-security-010, qz-security-011, qz-security-012, qz-security-013, qz-security-014, qz-security-015, qz-security-016, qz-security-017, qz-security-018, qz-security-019, qz-security-020, qz-security-021, qz-security-022, qz-primer-001, qz-primer-002, qz-primer-003**.

Viết vào `js/i18n/quiz-ops-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-ops-2.en.js` và `node scripts/check-i18n.js quiz-ops-2` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 22 mục vào `js/i18n/quiz-ops-2.en.js` (qz-aws-018..022, qz-security-009..022, qz-primer-001..003), chỉ gồm `q`, `options`, `explain`.
- Giữ nguyên markup, số lượng option, bảng, code block; dịch comment tiếng Việt trong code block. Không có backtick/`${` trong file.
- `node scripts/check-i18n.js quiz-ops-2` → OK (22 mục). `node scripts/validate.js` → OK — không có lỗi. (Lệnh `node --check` bị chặn quyền trong phiên này; check-i18n đã nạp file qua `vm` nên cú pháp hợp lệ.)
Reviewed-by: check-i18n (translation, no LLM review)
