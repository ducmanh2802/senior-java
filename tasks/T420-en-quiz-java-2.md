# T420 — Dịch sang tiếng Anh: quiz-java (23 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-collections-016, qz-collections-017, qz-collections-018, qz-collections-019, qz-collections-020, qz-modern-007, qz-modern-008, qz-modern-009, qz-modern-010, qz-modern-011, qz-modern-012, qz-modern-013, qz-modern-014, qz-modern-015, qz-modern-016, qz-modern-017, qz-modern-018, qz-modern-019, qz-modern-020, qz-concurrency-007, qz-concurrency-008, qz-concurrency-009, qz-concurrency-010**.

Viết vào `js/i18n/quiz-java-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-2.en.js` và `node scripts/check-i18n.js quiz-java-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 23/23 mục vào `js/i18n/quiz-java-2.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain`.
- Giữ nguyên số lượng và thứ tự `options` (kể cả câu `multi`), giữ nguyên id đáp án đúng trong phần giải thích.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, bảng, `~~~java`), code block chép y nguyên, chỉ dịch comment tiếng Việt trong code (ví dụ `// vòng lặp bận` → `// busy loop, calls no method`).
- Nhãn thống nhất với các file `quiz-*.en.js` khác: `**Correct answer: …**`, `### Why it is correct`, `### Why the other options are wrong`, `> Senior tip:`; câu nhiều đáp án dùng `(Choose N)`.
- Không có backtick, không có `${` trong nội dung.
- Kiểm tra: `node scripts/check-i18n.js quiz-java-2` → `OK — 23 mục đã dịch.` (script này parse file trong VM nên cũng xác nhận cú pháp); `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý môi trường: lệnh `node --check js/i18n/quiz-java-2.en.js` bị chặn quyền trên máy này nên không chạy trực tiếp được; cú pháp đã được xác nhận qua `check-i18n.js` (chạy file bằng `vm.runInNewContext`).
Reviewed-by: check-i18n (translation, no LLM review)
