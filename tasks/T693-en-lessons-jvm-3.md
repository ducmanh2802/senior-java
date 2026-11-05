# T693 — Dịch sang tiếng Anh: lessons-jvm (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jvm-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-jvm.js`: **lesson-jvm-004**.

Viết vào `js/i18n/lessons-jvm-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-jvm-3.en.js` và `node scripts/check-i18n.js lessons-jvm-3` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch trọn `lesson-jvm-004` vào `js/i18n/lessons-jvm-3.en.js`: title, goals (4), body (6 mục `###` + 2 code block + 1 `>`), exercises (2: title/prompt/hints/explain), check (3: q/options/explain). Không chép `starter`/`tests`/`reference` (bị `check-i18n.js` cấm).
- Thứ tự `options` giữ nguyên bản gốc nên `answer` (1, 3, 0) không cần phủ — `merge()` của `js/core/i18n.js` giữ answer từ bản tiếng Việt.
- Comment trong code block đã dịch sang tiếng Anh (`// mandatory with a thread pool, even if handle throws`, diagram `... 2 million Node objects, nobody reads them again`), đúng yêu cầu của check trong `scripts/check-i18n.js`.
- `node scripts/check-i18n.js lessons-jvm-3` → `OK — 1 mục đã dịch.` (script này chạy file trong `vm`, nên cú pháp đã được kiểm chứng; `node --check` không được cấp quyền thực thi trong phiên này).
- **Cần integrator xử lý (tôi không sở hữu file):** `node scripts/validate.js` vẫn exit 1 vì `js/data/sdlc.js: lỗi cú pháp/chạy: Unexpected token ')'` và báo "Mô phỏng SDLC: 0 kịch bản". File này đang **modified trong working tree** (`git diff --stat`: +895 dòng, kịch bản sdlc-007 về observability do agent task khác viết dở, chưa commit) — lỗi không liên quan tới thay đổi của T693, tôi không sửa theo luật 3/5 của AGENTS.md. Đề nghị: owner của sdlc-007 sửa dấu `)` thừa rồi chạy lại validate; ngoài ra validate chỉ còn các cảnh báo có sẵn (`q-java.js` answer ngắn modern-031..038/core-035, `path.js` 37 lesson ngoài PATH).
Reviewed-by: check-i18n (translation, no LLM review)
