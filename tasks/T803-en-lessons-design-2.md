# T803 — Dịch sang tiếng Anh: lessons-design (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-design-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-design.js`: **lesson-design-006**.

Viết vào `js/i18n/lessons-design-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-design-2.en.js` và `node scripts/check-i18n.js lessons-design-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch xong `lesson-design-006` vào `js/i18n/lessons-design-2.en.js`: title, goals (4), body (đủ 8 mục, 3 code block java/sql/seq), exercises[0] (title/prompt/hints 4/explain), check (4 mục: q/options/explain). Không chép starter/tests/reference.
- `node scripts/check-i18n.js lessons-design-2` → `OK — 1 mục đã dịch.` (file cũng được parse thật trong vm nên cú pháp JS hợp lệ; `node --check` bị chặn theo permission nên không chạy được trực tiếp).
- `node scripts/validate.js`: vẫn còn lỗi `index-light.js: đã cũ` + cảnh báo đáp án ngắn và 'bài học không nằm trong PATH' — tất cả đến từ các file dữ liệu khác đang bị agent khác sửa trong working tree (`js/data/q-ai.js`, `q-java.js`, `q-microservices.js`, `q-spring-data.js`), validate.js không đọc `js/i18n/*` nên không liên quan tới file của task này. Không chạy `build-light-index.js` vì sẽ ghi đè file integrator/agent khác đang dùng.
Reviewed-by: check-i18n (translation, no LLM review)
