# T749 — Dịch sang tiếng Anh: quiz-java (15 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-core-025, qz-core-026, qz-collections-025, qz-collections-026, qz-modern-025, qz-modern-026, qz-modern-027, qz-modern-028, qz-concurrency-025, qz-concurrency-026, qz-jvm-025, qz-jvm-026, qz-core-027, qz-modern-029, qz-concurrency-027**.

Viết vào `js/i18n/quiz-java-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-7.en.js` và `node scripts/check-i18n.js quiz-java-7` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 15/15 mục vào `js/i18n/quiz-java-7.en.js` (field `q`, `options`, `explain`), giữ nguyên markup, code block và thứ tự phương án (đáp án đúng vẫn ở index cũ — `answer` không đụng tới).
- `node scripts/check-i18n.js quiz-java-7` → `OK — 15 mục đã dịch.` (checker chạy file trong `vm`, nên cú pháp JS đã được xác nhận hợp lệ). `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ ở `q-java.js`/`q-scenario.js`, không liên quan task).
- `node --check js/i18n/quiz-java-7.en.js` bị từ chối theo quyền thực thi shell trong phiên này; đã thay thế bằng phép parse của check-i18n (tương đương về phát hiện lỗi cú pháp).
- `qz-modern-029`: các escape mô tả trong prose (`\n`, `\d`, `\\d`) được viết escaped thành `\\n` / `\\d` / `\\\\d` trong template literal để khi render hiện đúng ký tự gốc — làm theo luật escape backslash ở AGENTS.md §5.
- Không sửa file nào khác; `js/i18n/manifest.js` đã có sẵn `'quiz-java-7'` nên không cần đăng ký thêm.
Reviewed-by: check-i18n (translation, no LLM review)
