# T205 — Dịch sang tiếng Anh: q-scenario (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-4.en.js`

Ghi chú: Đã dịch đủ 13 mục scenario-044 → scenario-056 vào `js/i18n/q-scenario-4.en.js`; giữ nguyên markup, thuật ngữ và cấu trúc; `node scripts/check-i18n.js q-scenario-4` → OK 13 mục; `node scripts/validate.js` → OK. Không có backtick trong nội dung; không đụng file khác.

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-scenario.js`: **scenario-044, scenario-045, scenario-046, scenario-047, scenario-048, scenario-049, scenario-050, scenario-051, scenario-052, scenario-053, scenario-054, scenario-055, scenario-056**.

Viết vào `js/i18n/q-scenario-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-scenario-4.en.js` và `node scripts/check-i18n.js q-scenario-4` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
