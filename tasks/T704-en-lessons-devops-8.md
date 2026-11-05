# T704 — Dịch sang tiếng Anh: lessons-devops (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-011**.

Viết vào `js/i18n/lessons-devops-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-8.en.js` và `node scripts/check-i18n.js lessons-devops-8` → OK, rồi `Status: DONE`.

## Notes
- Lần chạy trước chỉ mới có stub (header + `App.i18n.content({})`), chưa có mục nào — viết lại toàn bộ phần dịch của `lesson-devops-011`.
- Dịch đủ: `title`, 4 `goals`, `body` (gồm cả sơ đồ `~~~seq` và khối `~~~java` — comment trong code đã dịch sang Anh, giữ đúng cú pháp seq), 1 `exercises[]` với `title/prompt/hints/explain`, 4 `check[]` với `q/options/explain`. Không chép `starter/tests/reference/answer`.
- Nhãn: "### Liên hệ phỏng vấn" → "### Interview notes"; `> Senior tip:` giữ nguyên; thuật ngữ (error rate, p95, blast radius, AnalysisTemplate, expand-contract…) giữ nguyên tiếng Anh.
- `node scripts/check-i18n.js lessons-devops-8` → `OK — 1 mục đã dịch.` (file chạy được trong VM nên cú pháp hợp lệ; `node --check` bị chặn bởi prompt quyền nên đã xác minh qua chính check-i18n). `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo short-answer/path là có sẵn từ trước, không liên quan file này).
Reviewed-by: check-i18n (translation, no LLM review)
