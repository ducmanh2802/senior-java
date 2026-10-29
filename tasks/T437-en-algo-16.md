# T437 — Dịch sang tiếng Anh: algo (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-16.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/algo.js`: **algo-109, algo-110, algo-111, algo-112, algo-113, algo-114, algo-115, algo-116, algo-117**.

Viết vào `js/i18n/algo-16.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **prompt, hints, solution, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/algo-16.en.js` và `node scripts/check-i18n.js algo-16` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 9 mục (algo-109 … algo-117) trong `js/i18n/algo-16.en.js`, mỗi mục chỉ gồm `prompt`, `hints`, `solution`, `follow`.
- Giữ nguyên markup (`**`, `{{...}}`, `###`, danh sách, bảng, `~~~lang`), toàn bộ code Java và ASCII tree; chỉ dịch comment tiếng Việt trong code block (đổi sang tiếng Anh, không viết lại code).
- Nhãn cố định đã theo quy định: `### Ràng buộc` → `### Constraints`, `### Ví dụ` → `### Example`, `### Ý tưởng` → `### Approach`, `### Độ phức tạp` → `### Complexity`, `### Lưu ý khi phỏng vấn` → `### Interview notes`, `Giải thích:` → `Explanation:`; `> Senior tip:` giữ nguyên.
- Số phần tử mảng `hints` (3) và `follow` (2) mỗi mục khớp bản gốc để merge theo index hoạt động đúng.
- `node scripts/check-i18n.js algo-16` → `OK — 9 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check js/i18n/algo-16.en.js` bị môi trường chặn (cùng lỗi với file không liên quan như `algo-15.en.js`), nên kiểm tra cú pháp bằng `scripts/check-i18n.js` — script này nạp file qua `vm.runInNewContext` nên file lỗi cú pháp sẽ báo ngay; kết quả OK.
Reviewed-by: check-i18n (translation, no LLM review)
