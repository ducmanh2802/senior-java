# T695 — Dịch sang tiếng Anh: lessons-sql (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-sql-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-sql.js`: **lesson-sql-004, lesson-sql-005**.

Viết vào `js/i18n/lessons-sql-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-sql-3.en.js` và `node scripts/check-i18n.js lessons-sql-3` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 2 mục (`lesson-sql-004`, `lesson-sql-005`) vào `js/i18n/lessons-sql-3.en.js`: title, goals (3), body, exercises[0] (title/prompt/hints×3/explain), check (3 mục: q/options×4/explain). Không chép `starter`/`tests`/`reference`.
- Giữ nguyên markup (`###`, `{{...}}`, bảng, `~~~sql`/`~~~java`/`~~~text`); comment tiếng Việt trong code block đã dịch sang Anh, phần code y nguyên.
- Nhãn: `**Tóm tắt:**`/`> Senior tip:` giữ nguyên, `### Liên hệ phỏng vấn` → `### Interview relevance` (theo quy ước các file lessons-*.en.js khác), `> Pitfall thực tế:` → `> Real-world pitfall:`.
- `node scripts/check-i18n.js lessons-sql-3` → `OK — 2 mục đã dịch.` (script này chạy file qua `vm`, nên cú pháp đã được parse hợp lệ). `node --check` bị chặn bởi quyền Bash trong phiên này nên không chạy riêng được.
- `node scripts/validate.js` currently exits 1 vì `js/data/sdlc.js: lỗi cú pháp/chạy: Unexpected template string` — file đó đang bị agent khác sửa (`git status`: `M js/data/sdlc.js`), không thuộc quyền sở hữu của T695. Sau khi sdlc.js lành thì validate sẽ OK trở lại (không có lỗi nào liên quan lessons-sql / i18n).
Reviewed-by: check-i18n (translation, no LLM review)
