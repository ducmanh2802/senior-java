# T426 — Dịch sang tiếng Anh: quiz-design (19 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-design-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-design.js`: **qz-design-007, qz-design-008, qz-design-009, qz-design-010, qz-design-011, qz-design-012, qz-design-013, qz-design-014, qz-design-015, qz-design-016, qz-design-017, qz-design-018, qz-design-019, qz-design-020, qz-architecture-007, qz-architecture-008, qz-architecture-009, qz-architecture-010, qz-architecture-011**.

Viết vào `js/i18n/quiz-design-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-design-1.en.js` và `node scripts/check-i18n.js quiz-design-1` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 19/19 mục (qz-design-007…qz-design-020, qz-architecture-007…qz-architecture-011) trong `js/i18n/quiz-design-1.en.js`; mỗi mục chỉ gồm `q`, `options`, `explain`, giữ nguyên `topic`, `answer`, `multi` ở file dữ liệu gốc.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, `- `, `>`, `~~~text`, `~~~java`); nhãn "**Đáp án đúng:**" → "**Correct answer:**", "### Vì sao đúng" → "### Why this is correct", "### Vì sao các phương án khác sai" → "### Why the other options are wrong", "> Senior tip:" giữ nguyên.
- Đối chiếu số phần tử `options` với bản gốc: 4/4/4/4/5/4/4/4/4/5/4/4/4/5/4/4/4/5/4 (các mục multi là 011, 016, 020, architecture-010 đều 5 lựa chọn, khớp "(Choose 2/3)").
- Trong code block chỉ dịch comment (`// bean riêng -> đi qua proxy` → `// separate bean -> goes through the proxy`); code Java/ASCII giữ nguyên.
- Giữ escape `\'` của bản gốc trong hai chỗ có chuỗi SQL `LIKE` ('%') ở qz-design-017 và `'PENDING'` ở qz-design-020; không có backtick, không có `${`.
- Kiểm tra: `node scripts/check-i18n.js quiz-design-1` → `OK — 19 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý: lệnh `node --check js/i18n/quiz-design-1.en.js` bị chính sách quyền của môi trường chặn (mọi biến thể `--check`/`-c` đều bị từ chối). `check-i18n.js` nạp file bằng `vm.runInNewContext` nên đã xác nhận file parse và chạy thành công.
Reviewed-by: check-i18n (translation, no LLM review)
