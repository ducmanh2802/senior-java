# T659 — Dịch sang tiếng Anh: q-scenario (17 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-12.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-scenario.js`: **scenario-087, scenario-088, scenario-089, scenario-090, scenario-091, scenario-092, scenario-093, scenario-094, scenario-095, scenario-096, scenario-097, scenario-098, scenario-099, scenario-100, scenario-101, scenario-102, scenario-103**.

Viết vào `js/i18n/q-scenario-12.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-scenario-12.en.js` và `node scripts/check-i18n.js q-scenario-12` → OK, rồi `Status: DONE`.

## Notes

Đã dịch đủ 17/17 mục (scenario-087 → scenario-103) vào `js/i18n/q-scenario-12.en.js` — chỉ field `q`, `a`, `follow`; giữ nguyên markup, code block (chỉ dịch comment tiếng Việt trong code), bảng, `{{code}}`, nhãn cố định (`**Summary:**`, `> Senior tip:`, `### Interview notes` style headings).

Kết quả kiểm:
- `node scripts/check-i18n.js q-scenario-12` → `OK — 17 mục đã dịch.` (script này chạy file trong VM nên đồng thời xác nhận cú pháp đúng; `node --check` không được cấp quyền thực thi trong phiên này).
- Đối chiếu cấu trúc thủ công: 20 dòng chứa `~~~` = 6 fence trong `q` (mỗi `q` 1 khối java inline) + 14 dòng fence của 7 code block trong `a` (087-092 java, 103 text) — khớp bản gốc. Grep từ khóa tiếng Việt (cả từ không dấu: khi/này/sửa/không/để…) → không còn.

`node scripts/validate.js` vẫn báo LỖI nhưng **không liên quan file của task này** (task chỉ sở hữu `js/i18n/q-scenario-12.en.js`, validate không đọc thư mục `js/i18n`):
- `q-autotest.js: lỗi cú pháp/chạy: missing ) after argument list`
- `lessons-autotest.js`: 6 id trong `related` không tồn tại (autotest-001/007/008/009/011/012)
- `index-light.js: đã cũ` — suy ra từ lỗi `q-autotest.js`; việc chạy `build-light-index.js` sẽ ghi đè file thuộc quyền integrator nên không tự làm.
→ Đề xuất integrator sửa `js/data/q-autotest.js` + `related` trong `lessons-autotest.js` rồi chạy `node scripts/build-light-index.js`.

File tạm còn sót: `tmp-compare-i18n.cjs` ở thư mục gốc (script đối chiếu markup tôi tạo để kiểm tra; không được cấp quyền `rm`, có thể xoá).
Reviewed-by: check-i18n (translation, no LLM review)
