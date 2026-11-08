# T1019 — Dịch sang tiếng Anh: lessons-microservices (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-microservices-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-microservices.js`: **lesson-microservices-009, lesson-microservices-010**.

Viết vào `js/i18n/lessons-microservices-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-microservices-8.en.js` và `node scripts/check-i18n.js lessons-microservices-8` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-microservices-009` (Timeout budget and deadline propagation) and `lesson-microservices-010` (Simulating Kafka: partition log, offsets, and commit strategies) into English, preserving full meaning/detail, all markup, and keeping technical terms unchanged.
- Each lesson includes translated `title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain`; code (`starter/tests/reference`) intentionally not included per task spec.
- Checks: `node --check js/i18n/lessons-microservices-8.en.js` OK; `node scripts/check-i18n.js lessons-microservices-8` → `OK — 2 mục đã dịch.`
- `node scripts/validate.js` reports 1 pre-existing unrelated error not owned by this task: `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. No other files changed.
Reviewed-by: check-i18n (translation, no LLM review)
