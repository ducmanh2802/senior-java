# T469 — Dịch sang tiếng Anh: lessons-devops (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-001, lesson-devops-002**.

Viết vào `js/i18n/lessons-devops-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-1.en.js` và `node scripts/check-i18n.js lessons-devops-1` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 2 mục `lesson-devops-001`, `lesson-devops-002`: title, goals (3 + 3), body, exercises[0] (title, prompt, hints, explain), check (3 + 3, gồm q, options, explain). Không chép starter/tests/reference.
- Thuật ngữ giữ nguyên (MaxRAMPercentage, OOMKilled, ParallelGCThreads, cgroup, preStop, SIGTERM, readiness/liveness/startup probe…), số liệu và bảng giữ nguyên; nhãn "### Liên hệ phỏng vấn" → "### Interview notes", "> Senior tip:" giữ nguyên.
- Giữ nguyên markup `**`, `{{code}}`, `###`, danh sách, bảng, `~~~bash/yaml/text`; comment tiếng Việt trong code block (YAML) đã dịch. Escape `\\` trong code bash giữ đúng như bản gốc.
- Kiểm tra: `node scripts/check-i18n.js lessons-devops-1` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (`node --check` bị chặn quyền shell trong phiên này, nhưng file được biên dịch qua `vm` của check-i18n nên cú pháp hợp lệ).
Reviewed-by: check-i18n (translation, no LLM review)
