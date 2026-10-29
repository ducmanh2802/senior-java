# T457 — Dịch sang tiếng Anh: lessons-jvm (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jvm-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-jvm.js`: **lesson-jvm-003**.

Viết vào `js/i18n/lessons-jvm-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-jvm-2.en.js` và `node scripts/check-i18n.js lessons-jvm-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `lesson-jvm-003` (Class loading và static init) sang `js/i18n/lessons-jvm-2.en.js`: title, goals, body, 2 exercises (title/prompt/hints/explain) và 4 câu check (q/options/explain). Không chép code (starter/tests/reference).
- Giữ nguyên markup và toàn bộ `~~~java` block (dịch comment `in ra` → `prints`); thuật ngữ (holder idiom, initialization lock, Metaspace, `<clinit>`, classloader…) giữ nguyên.
- `node scripts/check-i18n.js lessons-jvm-2` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: check-i18n (translation, no LLM review)
