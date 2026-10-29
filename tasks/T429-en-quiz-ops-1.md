# T429 — Dịch sang tiếng Anh: quiz-ops (23 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-ops.js`: **qz-devops-009, qz-devops-010, qz-devops-011, qz-devops-012, qz-devops-013, qz-devops-014, qz-devops-015, qz-devops-016, qz-devops-017, qz-devops-018, qz-devops-019, qz-devops-020, qz-devops-021, qz-devops-022, qz-aws-009, qz-aws-010, qz-aws-011, qz-aws-012, qz-aws-013, qz-aws-014, qz-aws-015, qz-aws-016, qz-aws-017**.

Viết vào `js/i18n/quiz-ops-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-ops-1.en.js` và `node scripts/check-i18n.js quiz-ops-1` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 23/23 mục (qz-devops-009…022, qz-aws-009…017) vào `js/i18n/quiz-ops-1.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain`; options giữ đúng số phần tử/thứ tự để merge theo index.
- Giữ nguyên markup `**`, `{{code}}`, `###`, danh sách, bảng `|`, khối `~~~text/bash/yaml/json/java~~~`; comment tiếng Việt trong code block đã dịch, code giữ nguyên. Không có backtick, không có `${`.
- Nhãn: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên; "### Vì sao các phương án còn lại sai" → "### Why the other options are wrong" (thống nhất với các file quiz-*.en.js khác).
- Kiểm tra: `node scripts/check-i18n.js quiz-ops-1` → OK (23 mục); `node scripts/validate.js` → OK. Lưu ý: lệnh `node --check js/i18n/quiz-ops-1.en.js` bị môi trường chặn quyền chạy nên đã xác nhận cú pháp qua vm trong check-i18n (file parse và chạy được).
- Không sửa file nào ngoài phạm vi task; `js/i18n/manifest.js` đã có sẵn `quiz-ops-1`.
Reviewed-by: check-i18n (translation, no LLM review)
