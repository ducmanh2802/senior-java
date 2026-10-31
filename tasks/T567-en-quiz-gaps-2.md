# T567 — Dịch sang tiếng Anh: quiz-gaps (22 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-gaps-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-gaps.js`: **qz-testing-020, qz-ai-009, qz-ai-010, qz-ai-011, qz-ai-012, qz-ai-013, qz-ai-014, qz-ai-015, qz-ai-016, qz-ai-017, qz-ai-018, qz-ai-019, qz-ai-020, qz-kotlin-009, qz-kotlin-010, qz-kotlin-011, qz-kotlin-012, qz-kotlin-013, qz-kotlin-014, qz-kotlin-015, qz-kotlin-016, qz-kotlin-017**.

Viết vào `js/i18n/quiz-gaps-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-gaps-2.en.js` và `node scripts/check-i18n.js quiz-gaps-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 22/22 mục (qz-testing-020, qz-ai-009…020, qz-kotlin-009…017) trong `js/i18n/quiz-gaps-2.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain`; giữ nguyên markup, code block và số lượng option/đoạn code so với bản gốc; comment tiếng Việt trong code block đã dịch.
- Tiêu đề cố định dùng: "**Correct answer:**", "### Why the other options are wrong", "> Senior tip:" (giữ nguyên); nhãn "### Lưu ý khi triển khai (Java)" dịch thành "### Implementation notes (Java)".
- `node scripts/check-i18n.js quiz-gaps-2` → `OK — 22 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (file cũng được vm parse thành công trong checker nên cú pháp hợp lệ).
Reviewed-by: check-i18n (translation, no LLM review)
