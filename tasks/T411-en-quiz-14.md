# T411 — Dịch sang tiếng Anh: quiz (16 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-14.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz.js`: **qz-security-001, qz-security-002, qz-security-003, qz-security-004, qz-security-005, qz-security-006, qz-security-007, qz-security-008, qz-behavioral-001, qz-behavioral-002, qz-behavioral-003, qz-behavioral-004, qz-behavioral-005, qz-behavioral-006, qz-behavioral-007, qz-behavioral-008**.

Viết vào `js/i18n/quiz-14.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-14.en.js` và `node scripts/check-i18n.js quiz-14` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 16 mục security/behavioral trong `js/i18n/quiz-14.en.js`, giữ nguyên markup, code, số liệu và độ chi tiết.
- `node scripts/check-i18n.js quiz-14` → `OK — 16 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.`
- Lệnh `node --check js/i18n/quiz-14.en.js` bị chặn bởi quyền shell; file đã được `check-i18n` nạp và parse thành công.
Reviewed-by: check-i18n (translation, no LLM review)
