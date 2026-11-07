# T766 — Dịch sang tiếng Anh: lessons-autotest (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-autotest.js`: **lesson-autotest-010**.

Viết vào `js/i18n/lessons-autotest-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-autotest-8.en.js` và `node scripts/check-i18n.js lessons-autotest-8` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `lesson-autotest-010` sang `js/i18n/lessons-autotest-8.en.js`: title, 5 goals, toàn bộ body (8 mục `###`, 4 code block `text/properties/yaml/text` — comment và nội dung sơ đồ trong code block cũng dịch sang tiếng Anh, giữ nguyên alignment), exercise (title, prompt + code block ví dụ, 5 hints, 4 đoạn explain) và 4 câu `check` (q/options/explain; không chép `answer`, `starter`, `tests`, `reference`).
- Giữ nguyên markup và nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `### Liên hệ phỏng vấn` → `### Interview connections` (khớp lessons-autotest-7.en.js), `> Senior tip:` giữ nguyên; thuật ngữ (LPT, makespan, shard, `{{@ResourceLock}}`, `mcr.microsoft.com/playwright/java`, `v1.47.0-noble`…) và số liệu giữ nguyên.
- `\${{ matrix.shard }}` / `\${{ matrix.shard }}` (artifact name) trong khối yaml được escape như bản gốc; không có backtick trong chuỗi dịch.
- Kiểm tra: `node scripts/check-i18n.js lessons-autotest-8` → `OK — 1 mục đã dịch.` (file parse được trong vm, tức cú pháp JS hợp lệ — `node --check` bị chặn bởi permission nên dùng cách này), `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo đáp án ngắn có sẵn từ trước trong q-java.js/q-scenario.js). File đã có trong `js/i18n/manifest.js` nên không sửa gì khác.
Reviewed-by: check-i18n (translation, no LLM review)
