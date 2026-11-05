# T681 — Dịch sang tiếng Anh: quiz-java (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-concurrency-023, qz-concurrency-024, qz-jvm-021, qz-jvm-022, qz-jvm-023, qz-jvm-024**.

Viết vào `js/i18n/quiz-java-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-6.en.js` và `node scripts/check-i18n.js quiz-java-6` → OK, rồi `Status: DONE`.

## Notes
Đã dịch đủ 6 mục (q + options + explain) vào `js/i18n/quiz-java-6.en.js`, giữ nguyên markup, `{{code}}`, bảng, `~~~java/text` và chỉ dịch comment trong code block (`// cố "upgrade"` → `// trying to "upgrade"`, `// không thoát ra ngoài method` → `// never escapes the method`), các sơ đồ `~~~text` trong explain cũng chuyển sang tiếng Anh để qua check "không còn tiếng Việt trong code".
Nhãn: `**Đáp án đúng:**` → `**Correct answer:**`, `### Vì sao các phương án còn lại sai` → `### Why the other options are wrong`, `> Senior tip:` giữ nguyên. Không chép `answer`/`multi`/`topic` (merge giữ bản gốc).
Kiểm tra: `node scripts/check-i18n.js quiz-java-6` → OK — 6 mục đã dịch (script chạy file trong vm nên đồng thời xác nhận cú pháp); `node scripts/validate.js` → OK. `node scripts/check-i18n.js` (toàn bộ) còn 2 lỗi cũ ở `topics-1.en.js` (id autotest/banking thiếu trong header ids) — không thuộc file task này. File đã có sẵn trong `js/i18n/manifest.js`, không sửa file nào khác.
Reviewed-by: check-i18n (translation, no LLM review)
