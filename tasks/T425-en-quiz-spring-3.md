# T425 — Dịch sang tiếng Anh: quiz-spring (15 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-spring-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-spring.js`: **qz-db-020, qz-api-009, qz-api-010, qz-api-011, qz-api-012, qz-api-013, qz-api-014, qz-api-015, qz-api-016, qz-api-017, qz-api-018, qz-api-019, qz-api-020, qz-api-021, qz-api-022**.

Viết vào `js/i18n/quiz-spring-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-spring-3.en.js` và `node scripts/check-i18n.js quiz-spring-3` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 15/15 mục (qz-db-020, qz-api-009…qz-api-022) trong `js/i18n/quiz-spring-3.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain`; giữ nguyên `answer`, `multi`, `topic`.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng, `~~~text`, `~~~java`, `~~~json`); nhãn "**Đáp án đúng:**" → "**Correct answer:**", "> Senior tip:" giữ nguyên.
- Code block giữ nguyên code; chỉ dịch phần prose tiếng Việt trong khối ví dụ (dòng ghi chú rate-limit ở 429, các message trong payload Problem Details 9457) cho nhất quán khi cả trang ở chế độ EN.
- Không có backtick, không có `${`, không có `\` trong nội dung (đã kiểm tra file nguồn).
- Kiểm tra: `node scripts/check-i18n.js quiz-spring-3` → `OK — 15 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý: lệnh `node --check js/i18n/quiz-spring-3.en.js` bị chặn bởi chính sách quyền của môi trường (mọi biến thể đều bị từ chối). Thay vào đó, `check-i18n.js` nạp file bằng `vm.runInNewContext` nên đã xác nhận file parse thành công; ngoài ra đã đối chiếu thủ công số phần tử `options` (4/4/4/4/4/5/4/4/4/4/4/4/4/4/4) khớp bản gốc.
Reviewed-by: check-i18n (translation, no LLM review)
