# T757 — Dịch sang tiếng Anh: lessons-devops (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-9.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-012**.

Viết vào `js/i18n/lessons-devops-9.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-9.en.js` và `node scripts/check-i18n.js lessons-devops-9` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ `lesson-devops-012` vào `js/i18n/lessons-devops-9.en.js`: title, goals (5), body (toàn bộ 10 mục + 2 hộp `> Note` + `> Senior tip`), exercises[0] (title/prompt/hints×5/explain), check (4 mục: q/options/explain). Không chép `starter`/`tests`/`reference`; comment tiếng Việt trong các code block `~~~java` và nhãn `~~~seq` đã dịch sang tiếng Anh không dấu.
- `node scripts/check-i18n.js lessons-devops-9` → `OK — 1 mục đã dịch.` (script này nạp file bằng `vm.runInNewContext`, nên lỗi cú pháp cũng sẽ bị bắt — file parse sạch). `node scripts/validate.js` → OK — không có lỗi.
- Trong môi trường này lệnh `node --check <file>` bị chặn bởi quy tắc quyền nên không chạy được trực tiếp; kiểm tra cú pháp đã được phủ bằng check-i18n ở trên.
- Chạy `node scripts/check-i18n.js` (toàn bộ) vẫn báo 2 lỗi có sẵn từ trước ở `js/i18n/topics-1.en.js` (id `autotest`, `banking` không nằm trong dòng `ids:` của header file đó) — không thuộc file do task này sở hữu, đề xuất tích hợp sửa bằng cách thêm 2 id vào header hoặc dịch chúng.
Reviewed-by: check-i18n (translation, no LLM review)
