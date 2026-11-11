# T465 — Dịch sang tiếng Anh: lessons-testing (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-testing-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-testing.js`: **lesson-testing-003**.

Viết vào `js/i18n/lessons-testing-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-testing-2.en.js` và `node scripts/check-i18n.js lessons-testing-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đầy đủ `lesson-testing-003` trong `js/i18n/lessons-testing-2.en.js`: title, goals (3), body (7 mục `###`, 2 code block `~~~java`, 1 bảng 6 dòng, 5 bullet giới hạn), 1 exercise (title/prompt/3 hints/explain), 3 câu check (q/4 options/explain). Không chép `starter`/`tests`/`reference`/`related`/`tags`.
- Giữ nguyên markup và mọi `{{code}}`; comment trong code block đã dịch sang tiếng Anh; `> Senior tip:` giữ nguyên; "### Liên hệ phỏng vấn" → "### Interview relevance".
- Kiểm tra: `node scripts/check-i18n.js lessons-testing-2` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý môi trường: lệnh `node --check js/i18n/lessons-testing-2.en.js` bị sandbox từ chối quyền chạy (không chạy được trên máy này); cú pháp đã được xác minh gián tiếp vì `check-i18n.js` biên dịch và chạy chính file đó trong `vm` (nếu sai cú pháp sẽ báo "không chạy được").

