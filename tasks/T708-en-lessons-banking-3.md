# T708 — Dịch sang tiếng Anh: lessons-banking (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-banking-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-banking.js`: **lesson-banking-006**.

Viết vào `js/i18n/lessons-banking-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-banking-3.en.js` và `node scripts/check-i18n.js lessons-banking-3` → OK, rồi `Status: DONE`.

## Notes
- Dịch xong `lesson-banking-006` (title, goals, body, exercises[0].title/prompt/hints/explain, check[0..3].q/options/explain) — đủ 1/1 mục, đúng thứ tự mảng, không chép starter/tests/reference.
- Giữ nguyên markup và các nhãn: `**Summary:**` không có trong bài này; `> Senior tip:` giữ nguyên; `### Interview connection` theo khuôn banking-2; `{{code}}`, bảng, `~~~java`, `~~~seq` giữ nguyên.
- Dịch cả comment trong `~~~java` và toàn bộ nhãn/actor trong `~~~seq` (NganHangNhan → ReceivingBank) vì check-i18n soi cả code block; số liệu đổi dấu phân cách nghìn sang 101,100 cho tự nhiên.
- Giải thích thuật ngữ lần đầu xuất hiện (suspense account, inquiry, switching hub) bằng 1 câu + ví dụ, theo chuẩn người đọc mới tiếp xúc công nghệ ngân hàng.
- `node scripts/check-i18n.js lessons-banking-3` → OK — 1 mục đã dịch (file parse được trong vm, chứng tỏ cú pháp đúng; `node --check` bị chặn quyền chạy shell ở phiên này).
- `node scripts/validate.js` → OK — không có lỗi (chỉ còn cảnh báo đáp án ngắn có sẵn từ trước, không thuộc file này). Không cần build-light-index vì không thêm/sửa dữ liệu gốc.
Reviewed-by: check-i18n (translation, no LLM review)
