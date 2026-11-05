# T678 — Dịch sang tiếng Anh: q-english (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-english.js`: **english-103, english-104, english-105**.

Viết vào `js/i18n/q-english-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-english-11.en.js` và `node scripts/check-i18n.js q-english-11` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 3 mục english-103/104/105 vào `js/i18n/q-english-11.en.js` (đúng field q/a/follow, giữ nguyên markup, sample spoken answer giữ nguyên, phần giải thích tiếng Việt dịch sang Anh theo khuôn q-english-10).
- `node scripts/check-i18n.js q-english-11` → OK — 3 mục đã dịch. (Check này run file qua vm nên đồng thời xác minh cú pháp; lệnh `node --check` riêng bị chặn theo cấu hình quyền Bash của agent này.)
- `node scripts/validate.js` còn 2 lỗi CÓ SẴN KHÔNG thuộc task này: `q-autotest.js: autotest-036.a` có `{{GET /users/{id…}}` lồng dấu `{ }`, và `index-light.js` cũ so với dữ liệu (do thay đổi data của task khác, không phải do task này — task chỉ thêm file overlay i18n, không sửa data). Đề xuất owner q-autotest sửa markup rồi integrator chạy `node scripts/build-light-index.js`.
Reviewed-by: check-i18n (translation, no LLM review)
