# T676 — Dịch sang tiếng Anh: q-english (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-9.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-english.js`: **english-081, english-082, english-083, english-084, english-085, english-086, english-087, english-088, english-089, english-090, english-091, english-092, english-093**.

Viết vào `js/i18n/q-english-9.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-english-9.en.js` và `node scripts/check-i18n.js q-english-9` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 13/13 mục (english-081 … english-093) vào `js/i18n/q-english-9.en.js`; file đã có sẵn trong `js/i18n/manifest.js` nên không cần sửa file khác.
- `node scripts/check-i18n.js q-english-9` → `OK — 13 mục đã dịch.` (script này nạp file bằng `vm`, nên mọi lỗi cú pháp đều bị bắt; bản thân `node --check <file>` bị chặn bởi permission config của môi trường nên không chạy trực tiếp được).
- Cấu trúc giữ nguyên 1:1 với bản gốc: số đoạn trong `### Sample answer`, số mục trong `### Useful phrases`, `### Common mistakes Vietnamese speakers make`, và `> Senior tip:` (nhãn giữ nguyên theo yêu cầu). Các heading tiếng Việt được dịch (`### Dòng chảy cần nhớ…` → `### The flow to remember…`, `### Giải nghĩa thuật ngữ…` → `### Term explanations…`, `### Ba lớp phòng thủ…` → `### Three lines of defence…`, `### Vì sao mẫu này tốt` → `### Why this sample works`, `### Khung trả lời…` → `### Answer framework…`).
- Khối `~~~seq` của english-090 được dịch sang tiếng Anh nhưng vẫn giữ đúng cú pháp seq (title/actors/arrows/note, mỗi bước ≤ 60 ký tự) và giữ nguyên tên kỹ thuật (Idempotency-Key, PENDING, 202 Accepted).
- `node scripts/validate.js` currently exits 1 with `index-light.js: đã cũ so với dữ liệu` — lỗi này **không** do task này gây ra: `git status` cho thấy `js/data/companies.js`, `js/data/lessons-autotest.js`, `js/data/q-microservices.js`, `js/data/quiz-autotest.js` đang bị task khác sửa dở trong working tree. Em không chạy `build-light-index.js` vì file sinh thuộc quyền integrator và sẽ ghi đè phần đang staged của task khác — người tích hợp chạy lại sau khi merge là hết.
Reviewed-by: check-i18n (translation, no LLM review)
