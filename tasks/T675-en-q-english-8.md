# T675 — Dịch sang tiếng Anh: q-english (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-english.js`: **english-072, english-073, english-074, english-075, english-076, english-077, english-078, english-079, english-080**.

Viết vào `js/i18n/q-english-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-english-8.en.js` và `node scripts/check-i18n.js q-english-8` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 9/9 mục (english-072 → english-080) vào `js/i18n/q-english-8.en.js`, giữ nguyên cấu trúc markup và độ dài/chi tiết bản gốc.
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `### Vì sao câu trả lời này hiệu quả` → `### Why this answer works`, `### Lỗi người Việt hay mắc` → `### Common mistakes Vietnamese speakers make`; `### Sample answer`, `### Useful phrases`, `> Senior tip:` giữ nguyên. Gloss của Useful phrases viết lại bằng tiếng Anh (theo khuôn q-english-7).
- `q` và `follow` của 9 mục này vốn đã là tiếng Anh nên chép nguyên văn.
- `node scripts/check-i18n.js q-english-8` → `OK — 9 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (`node --check` bị chặn quyền chạy lệnh đơn, nhưng check-i18n đã `vm.runInNewContext` file này nên cú pháp hợp lệ).
- File đã có sẵn trong `js/i18n/manifest.js` (`q-english-8`), không cần sửa file khác.
- Ngoài phạm vi task: `node scripts/check-i18n.js` (toàn bộ) vẫn báo 2 lỗi ở `js/i18n/topics-1.en.js` (id `autotest`, `banking` không có trong dòng `ids:` của header file đó). Đó là file do task T698 sở hữu (stub rỗng, chưa chạy), không phải file của task này — task T675 không sửa.
Reviewed-by: check-i18n (translation, no LLM review)
