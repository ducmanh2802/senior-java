# T467 — Dịch sang tiếng Anh: lessons-api (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-api-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-api.js`: **lesson-api-001, lesson-api-002**.

Viết vào `js/i18n/lessons-api-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-api-1.en.js` và `node scripts/check-i18n.js lessons-api-1` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 2 mục `lesson-api-001`, `lesson-api-002` trong `js/i18n/lessons-api-1.en.js`: title, goals, body (giữ nguyên toàn bộ mục `###`, bảng, danh sách, code block `~~~text`/`~~~json`), exercises[0].title/prompt/hints/explain, check[0..3].q/options/explain. Không chép `starter`/`tests`/`reference`.
- Nhãn cố định: "### Liên hệ phỏng vấn" → "### Interview relevance" (theo các bài học EN đã có). Trong code block `~~~json` của Problem Details, dịch các chuỗi người đọc được (`detail`, `message`) sang tiếng Anh, giữ nguyên cấu trúc JSON.
- `node scripts/check-i18n.js lessons-api-1` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (`node --check` bị chặn bởi quyền shell trong phiên này, nhưng check-i18n chạy file trong `vm` nên đã xác nhận cú pháp).
- Không sửa file nào ngoài `js/i18n/lessons-api-1.en.js` và file task này.
Reviewed-by: check-i18n (translation, no LLM review)
