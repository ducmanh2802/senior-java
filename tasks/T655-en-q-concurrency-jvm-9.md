# T655 — Dịch sang tiếng Anh: q-concurrency-jvm (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-9.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-concurrency-jvm.js`: **concurrency-032, concurrency-033, concurrency-034, concurrency-035, concurrency-036, concurrency-037, jvm-033, jvm-034, jvm-035, jvm-036**.

Viết vào `js/i18n/q-concurrency-jvm-9.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-concurrency-jvm-9.en.js` và `node scripts/check-i18n.js q-concurrency-jvm-9` → OK, rồi `Status: DONE`.

## Notes

- Đã tạo `js/i18n/q-concurrency-jvm-9.en.js` với đủ 10 id (concurrency-032…037, jvm-033…036), mỗi mục chỉ có field `q`, `a`, `follow`; `tags`/`refs` không chép (giữ nguyên như gốc tiếng Việt).
- Bản gốc các mục này không có mảng object (`exercises`/`check`) nên chỉ dịch `follow` (mảng chuỗi, giữ đủ 3 phần tử theo đúng thứ tự).
- Dịch toàn bộ comment/chuỗi tiếng Việt bên trong code block `~~~java` (checker `check-i18n.js` bắt lỗi tiếng Việt trong code). Nhãn `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên, markup `{{...}}`, bảng, `~~~java` giữ đúng.
- Không có backtick và không có `${` trong nội dung dịch; không có ký tự tiếng Việt nào còn sót.
- `node scripts/check-i18n.js q-concurrency-jvm-9` → `OK — 10 mục đã dịch.` (checker chạy file trong VM nên đồng thời xác nhận file parse/run được; `node --check` tách riêng không được cấp quyền shell trong phiên này).
- `node scripts/validate.js` **vẫn báo lỗi, nhưng không phải do task này**: `companies.js: lỗi cú pháp/chạy: Unexpected string`, `lessons-autotest.js: lesson-autotest-006.exercises[0].hints[0]` có `{{...}}` lồng ngoặc, và `index-light.js` đã cũ. Ba file này nằm ngoài quyền sở hữu của T655 và đang bị sửa dở bởi agent khác (`git status`: `M js/data/companies.js`, `M js/data/lessons-autotest.js`, `M js/data/index-light.js`). Không tự sửa và không chạy `build-light-index.js` vì sẽ ghi đè file của người khác — integrator chạy lại sau khi các task dữ liệu kia xong.
- `js/i18n/manifest.js` đã có sẵn entry `'q-concurrency-jvm-9'` (dòng 155), không cần chỉnh.
Reviewed-by: check-i18n (translation, no LLM review)
