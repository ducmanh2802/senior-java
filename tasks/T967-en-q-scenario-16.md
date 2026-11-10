# T967 — Dịch sang tiếng Anh: q-scenario (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-16.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-scenario.js`: **scenario-125, scenario-126, scenario-127, scenario-128, scenario-129, scenario-130**.

Viết vào `js/i18n/q-scenario-16.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-scenario-16.en.js` và `node scripts/check-i18n.js q-scenario-16` → OK, rồi `Status: DONE`.

## Notes

Done. Translated scenario-125..130 (q, a, follow only) into js/i18n/q-scenario-16.en.js, faithful to the Vietnamese originals: no sections dropped or summarized, all markup (`**`, `{{code}}`, `###`, tables, `~~~text`/`~~~sql`/`~~~java`) kept, code/comments inside fences translated, fixed labels applied ("**Summary:**", "> Senior tip:" kept). Vietnamese-specific units converted to ASCII ("triệu" → million, "đồng" → dong, "Tết" → Tet) so the diacritic validator passes; numbers, ticket IDs, times and code kept verbatim.

Verification:
- node --check js/i18n/q-scenario-16.en.js → OK
- node scripts/check-i18n.js q-scenario-16 → OK — 6 mục đã dịch
- node scripts/validate.js → OK — không có lỗi
Only js/i18n/q-scenario-16.en.js and this task file were modified; no git commit.
Reviewed-by: check-i18n (translation, no LLM review)
