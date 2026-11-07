# T691 — Dịch sang tiếng Anh: lessons-jpa (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jpa-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-jpa.js`: **lesson-jpa-006, lesson-jpa-007**.

Viết vào `js/i18n/lessons-jpa-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-jpa-2.en.js` và `node scripts/check-i18n.js lessons-jpa-2` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 2 mục `lesson-jpa-006`, `lesson-jpa-007` vào `js/i18n/lessons-jpa-2.en.js` (title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain). Không chép `starter`/`tests`/`reference`.
- Nhãn cố định: `### Liên hệ phỏng vấn` → `### Interview relevance` (khớp `lessons-jpa-1.en.js`), `### Lỗi production hay gặp` → `### Bugs you actually meet in production`; giữ `>` tip, bảng, `~~~java`/`~~~seq`; comment tiếng Việt trong code block đã dịch sang tiếng Anh không dấu.
- `~~~seq` trong body 006: dịch nhãn `title:` và các bước, giữ nguyên tên actor `App | Hibernate | DB`.
- Kiểm: `node scripts/check-i18n.js lessons-jpa-2` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ của q-java/q-english + `path.js: lesson-jpa-006/007 không nằm trong PATH`, không thuộc file này).
- `node --check js/i18n/lessons-jpa-2.en.js` bị chặn bởi permission prompt của agent, nên chưa chạy trực tiếp; file đã được `check-i18n.js` thực thi trong `vm.runInNewContext` (lỗi cú pháp sẽ báo "không chạy được") → cú pháp hợp lệ. Integrator có thể chạy lại `node --check` để xác nhận.
- Không sửa file nào khác; không commit.

Reviewed-by: check-i18n (translation, no LLM review)
