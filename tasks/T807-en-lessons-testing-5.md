# T807 — Dịch sang tiếng Anh: lessons-testing (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-testing-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-testing.js`: **lesson-testing-006**.

Viết vào `js/i18n/lessons-testing-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-testing-5.en.js` và `node scripts/check-i18n.js lessons-testing-5` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đầy đủ `lesson-testing-006` sang `js/i18n/lessons-testing-5.en.js`: title, goals (4), body (toàn bộ 10 mục + 2 code block + 2 bảng), exercises[0] (title, prompt, hints ×4, explain), check ×4 (q, options ×4, explain). Không chép `starter/tests/reference`.
- Thứ tự `check[].options` giữ nguyên vị trí đáp án đúng (answer=1 ở cả 4 câu) nên không cần phủ field `answer`.
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `### Liên hệ phỏng vấn` → `### Interview relevance` (theo khuôn lessons-testing-1/2), `> Senior tip:` giữ nguyên. Dịch cả comment trong `~~~java` và các dòng `~~~text` (check-i18n soi cả code block).
- `node scripts/check-i18n.js lessons-testing-5` → `OK — 1 mục đã dịch.` (`node --check` bị chặn bởi permission của shell trong phiên này; script check-i18n đã parse + execute chính file trong `vm`, nếu sai cú pháp sẽ báo "không chạy được" nên yêu cầu cú pháp đã được xác minh). `js/i18n/manifest.js` đã có sẵn `'lessons-testing-5'`, không cần sửa.
- `node scripts/validate.js` đang exit 1 vì lỗi **có sẵn từ file của task khác** trên nhánh `content`: `q-spring-data.js: lỗi cú pháp/chạy: Unexpected token ','`, các `related` trỏ id `spring-*`/`db-*` chưa tồn tại trong `lessons-spring.js`/`lessons-db.js`/`lessons-sql.js`/`projects.js`/`path.js`, và `index-light.js` cũ. `validate.js` không đọc `js/i18n/*` nên không liên quan tới thay đổi của T807; em không sửa file ngoài quyền sở hữu (luật 3).
Reviewed-by: check-i18n (translation, no LLM review)
