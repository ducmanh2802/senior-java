# T181 — Dịch sang tiếng Anh: q-spring-data (12 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-9.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-spring-data.js`: **spring-028, spring-029, spring-030, spring-031, spring-032, spring-033, jpa-022, jpa-023, jpa-024, jpa-025, jpa-026, jpa-027**.

Viết vào `js/i18n/q-spring-data-9.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-spring-data-9.en.js` và `node scripts/check-i18n.js q-spring-data-9` → OK, rồi `Status: DONE`.

## Notes

Đã dịch đủ 12 mục (spring-028…033, jpa-022…027) vào `js/i18n/q-spring-data-9.en.js`, mỗi mục chỉ gồm field `q`, `a`, `follow`. Giữ nguyên markup, `{{code}}`, bảng, nhãn "Summary:", "Senior tip:"; "### Pitfall production" dịch thành "### Production pitfalls", header `ids` giữ danh sách 12 id gốc. File khung trống từ lần chạy gián đoạn trước được giữ và điền tiếp. Kiểm tra: `node --check` OK, `node scripts/check-i18n.js q-spring-data-9` → `OK — 12 mục đã dịch.`, `node scripts/validate.js` → OK (cảnh báo còn lại là của q-english.js, ngoài phạm vi). File `js/i18n/manifest.js` (integrator) đã có sẵn `q-spring-data-9` nên không cần đổi.
Reviewed-by: check-i18n (translation, no LLM review)
