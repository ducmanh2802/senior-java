# T427 — Dịch sang tiếng Anh: quiz-design (19 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-design-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-design.js`: **qz-architecture-012, qz-architecture-013, qz-architecture-014, qz-architecture-015, qz-architecture-016, qz-architecture-017, qz-architecture-018, qz-architecture-019, qz-architecture-020, qz-microservices-007, qz-microservices-008, qz-microservices-009, qz-microservices-010, qz-microservices-011, qz-microservices-012, qz-microservices-013, qz-microservices-014, qz-microservices-015, qz-microservices-016**.

Viết vào `js/i18n/quiz-design-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-design-2.en.js` và `node scripts/check-i18n.js quiz-design-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 19 mục (`qz-architecture-012…020`, `qz-microservices-007…016`) vào `js/i18n/quiz-design-2.en.js`, chỉ gồm `q`, `options`, `explain`; số option mỗi câu khớp bản gốc (4–5), giữ nguyên `answer`/`multi` từ dữ liệu gốc.
- Giữ nguyên markup: `**`, `{{code}}`, `###`, `> Senior tip:`, bảng Markdown, code block `~~~java`/`~~~text`; comment tiếng Việt trong code block đã dịch sang tiếng Anh ("Khác loại tiền" → "Currency mismatch", "empty = qua" → "empty = pass", "lắp theo cấu hình sản phẩm" → "assembled from product configuration"…).
- Nhãn cố định: "Đáp án đúng" → "Correct answer", "Vì sao đúng" → "Why it is correct", "Vì sao các phương án khác sai" → "Why the other options are wrong", "Cách thiết kế đúng" → "How to design it correctly", "Bảng nhớ nhanh" → "Quick-reference table"; các "(Chọn N)" → "(Choose N)".
- Không có backtick, không có `${`, giữ `\'` escape như bản gốc (vd `current_setting(\'app.tenant_id\')`, `{{ALTER TABLE ... RENAME COLUMN}}`).
- Kiểm tra: `node scripts/check-i18n.js quiz-design-2` → `OK — 19 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` Lệnh `node --check` bị chặn bởi permission layer của phiên (không phải lỗi cú pháp); `check-i18n` chạy file qua `vm.runInNewContext` nên đã xác nhận file parse sạch.
Reviewed-by: check-i18n (translation, no LLM review)
