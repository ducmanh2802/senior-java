# T1033 — Dịch sang tiếng Anh: lessons-devops (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-014, lesson-devops-015, lesson-devops-016, lesson-devops-017**.

Viết vào `js/i18n/lessons-devops-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-11.en.js` và `node scripts/check-i18n.js lessons-devops-11` → OK, rồi `Status: DONE`.

## Notes

Dịch đầy đủ 4 bài học (lesson-devops-014 Prometheus alert rule, 015 health check/failover, 016 RBAC authorizer, 017 PVC/StorageClass) vào `js/i18n/lessons-devops-11.en.js` qua `App.i18n.content({...})`, chỉ các field dịch (title/goals/body/exercises/check), giữ markup `{{code}}`, `###`, `**`, bảng, `~~~`, dịch comment trong code, giữ nhãn "**Summary:**" và "> Senior tip:". Kiểm tra: `node --check js/i18n/lessons-devops-11.en.js` OK, `node scripts/check-i18n.js lessons-devops-11` → OK — 4 mục đã dịch. `node scripts/validate.js` báo lỗi cũ ở `q-banking.js: banking-014.a` (~~~seq 8 actors) — file không thuộc task này, không sửa theo luật 3 AGENTS.md.Reviewed-by: check-i18n (translation, no LLM review)
