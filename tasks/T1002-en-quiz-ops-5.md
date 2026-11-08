# T1002 — Dịch sang tiếng Anh: quiz-ops (26 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-ops.js`: **qz-devops-051, qz-devops-052, qz-devops-053, qz-devops-054, qz-devops-055, qz-devops-056, qz-devops-057, qz-devops-058, qz-aws-023, qz-aws-024, qz-aws-025, qz-aws-026, qz-aws-027, qz-aws-028, qz-aws-029, qz-devops-059, qz-devops-060, qz-devops-061, qz-devops-062, qz-devops-063, qz-devops-064, qz-devops-065, qz-devops-066, qz-devops-067, qz-devops-068, qz-devops-069**.

Viết vào `js/i18n/quiz-ops-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-ops-5.en.js` và `node scripts/check-i18n.js quiz-ops-5` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
