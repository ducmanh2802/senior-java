# T705 — Dịch sang tiếng Anh: lessons-ai (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-ai-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-ai.js`: **lesson-ai-002, lesson-ai-003, lesson-ai-004**.

Viết vào `js/i18n/lessons-ai-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-ai-2.en.js` và `node scripts/check-i18n.js lessons-ai-2` → OK, rồi `Status: DONE`.

## Notes
Đã dịch 3 mục (lesson-ai-002, lesson-ai-003, lesson-ai-004) vào `js/i18n/lessons-ai-2.en.js`, chỉ các field được dịch: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain (starter/tests/reference không chép). Nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Liên hệ phỏng vấn" → "### Interview relevance", "### Lời giải" → "### Solution", "### Lỗi hay gặp" → "### Common mistakes". Giữ nguyên markup, regex trong code block `~~~text` (kèm `\\b`, `\\d`…), số liệu/tên riêng/thuật ngữ (CCCD ghi chú thêm "national ID card", NĐ 13/2023 → Decree 13/2023/NĐ-CP); thứ tự đánh số mục gốc (lesson-ai-004 có hai mục "### 5") được giữ như bản gốc.
Kiểm: `node scripts/check-i18n.js lessons-ai-2` → `OK — 3 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` File được chạy thật trong VM bởi check-i18n nên cú pháp đã được xác minh (`node --check <file>` bị chặn quyền chạy nên không invoke trực tiếp). Chạy `node scripts/check-i18n.js` toàn cục còn 2 lỗi có sẵn ở `topics-1.en.js` (id autotest/banking ngoài danh sách ids của file) — không thuộc file T705 sở hữu, đề xuất integrator sửa header `ids:` của file đó.
Reviewed-by: check-i18n (translation, no LLM review)
