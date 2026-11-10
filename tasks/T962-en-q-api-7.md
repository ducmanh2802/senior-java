# T962 — Dịch sang tiếng Anh: q-api (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-api-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-api.js`: **api-031, api-032, api-033, api-034, api-035, api-036, api-037**.

Viết vào `js/i18n/q-api-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-api-7.en.js` và `node scripts/check-i18n.js q-api-7` → OK, rồi `Status: DONE`.

## Notes

Đã dịch đầy đủ 7 mục api-031 → api-037 (HTTP/2/3, gRPC internals, idempotency key, ETag/If-Match, webhook, distributed rate limiting, HTTP caching) vào `js/i18n/q-api-7.en.js` qua `App.i18n.content(...)`. Giữ nguyên markup, labels cố định ("**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên), chỉ dịch field q/a/follow, không chép code/artifact.
- `node --check js/i18n/q-api-7.en.js` → OK
- `node scripts/check-i18n.js q-api-7` → OK — 7 mục đã dịch
- `node scripts/validate.js` → OK — không có lỗi (cảnh báo q-java.js modern-033 và path.js là cũ, không liên quan task này)
manifest.js đã có 'q-api-7' nên file được nạp khi chuyển sang EN.
Reviewed-by: check-i18n (translation, no LLM review)
