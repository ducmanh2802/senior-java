# T762 — Dịch sang tiếng Anh: lessons-autotest (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-autotest.js`: **lesson-autotest-006**.

Viết vào `js/i18n/lessons-autotest-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-autotest-4.en.js` và `node scripts/check-i18n.js lessons-autotest-4` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `lesson-autotest-006` (1/1 mục): title, 4 goals, toàn bộ body (7 code block giữ nguyên code, chỉ dịch comment + label `~~~seq`), 1 exercise (title/prompt/4 hints/explain), 4 câu check (q/options/explain — không chép `answer`).
- `node scripts/check-i18n.js lessons-autotest-4` → `OK — 1 mục đã dịch.` ; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo đáp án ngắn có sẵn từ trước ở q-java.js / q-scenario.js, không thuộc file này).
- `node --check <file>` bị chặn bởi permission ở phiên này; file đã được parse thật qua `vm.runInNewContext` trong check-i18n.js nên cú pháp đã được xác nhận hợp lệ.
- Quy ước nhãn theo các file chị em: `### Liên hệ phỏng vấn` → `### Interview connection`, `### Lỗi hay gặp` → `### Common mistakes`, `> Senior tip:` giữ nguyên. Không sửa file nào khác (manifest đã có sẵn `lessons-autotest-4`).
Reviewed-by: check-i18n (translation, no LLM review)
