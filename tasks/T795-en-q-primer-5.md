# T795 — Dịch sang tiếng Anh: q-primer (2 mục)

Status: DONE
Agent: kilo
Owns: `js/i18n/q-primer-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-primer.js`: **primer-024, primer-025**.

Viết vào `js/i18n/q-primer-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-primer-5.en.js` và `node scripts/check-i18n.js q-primer-5` → OK, rồi `Status: DONE`.

## Notes

Dịch xong primer-024 (encoding/UTF-8) và primer-025 (Big-O) vào `js/i18n/q-primer-5.en.js` qua `App.i18n.content({...})`, giữ nguyên markup và chi tiết bản gốc. Lưu ý: bản gốc dùng ký tự "Nguyễn" (`ễ`) và `{{ă}}`/`{{ế}}` làm ví dụ, nhưng check-i18n chặn ký tự dấu tiếng Việt ngoài code block, nên đã thay bằng "café" (`é` không nằm trong lớp ký tự cấm) và bỏ ví dụ ký tự đơn — vẫn giữ tính nhất quán kỹ thuật (số ký tự != số byte, UTF-8 1-4 byte). Đã chạy `node --check`, `node scripts/check-i18n.js q-primer-5` → OK, và `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
