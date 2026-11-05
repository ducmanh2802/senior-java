# T677 — Dịch sang tiếng Anh: q-english (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-10.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-english.js`: **english-094, english-095, english-096, english-097, english-098, english-099, english-100, english-101, english-102**.

Viết vào `js/i18n/q-english-10.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-english-10.en.js` và `node scripts/check-i18n.js q-english-10` → OK, rồi `Status: DONE`.

## Notes
- Dịch đủ 9/9 mục (english-094 → english-102) vào `js/i18n/q-english-10.en.js`; giữ nguyên các đoạn sample answer đã là tiếng Anh, chỉ dịch phần khung tiếng Việt (Tóm tắt → Summary, giải thích từ gốc, lỗi hay mắc, senior tip, seq diagram của english-097/101).
- `node scripts/check-i18n.js q-english-10` → `OK — 9 mục đã dịch.` (`node --check` bị chặn theo cấu hình quyền shell; check-i18n đã parse + chạy file trong vm nên cú pháp đã được xác nhận hợp lệ).
- `node scripts/validate.js` vẫn báo LỖI nhưng **không liên quan file của task này**: `q-autotest.js` (autotest-036) và `lessons-autotest.js` (lesson-autotest-014) chứa inline code `{{...}}` lồng dấu `{ }` — hai file đó đang bị agent khác sửa dở (`git status`: M). Chạy full `check-i18n.js` cũng lỗi ở `topics-1.en.js` (id autotest/banking), file của task khác.
- `index-light.js` báo cũ là do các sửa đổi dữ liệu của task khác trong working tree; task này không thêm/sửa câu hỏi nên không chạy `build-light-index.js` (file thuộc integrator).
Reviewed-by: check-i18n (translation, no LLM review)
