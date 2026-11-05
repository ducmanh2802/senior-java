# T692 — Dịch sang tiếng Anh: lessons-db (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-db-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-db.js`: **lesson-db-006, lesson-db-007**.

Viết vào `js/i18n/lessons-db-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-db-3.en.js` và `node scripts/check-i18n.js lessons-db-3` → OK, rồi `Status: DONE`.

## Notes
- `js/i18n/lessons-db-3.en.js` đã đủ 2/2 mục (lesson-db-006, lesson-db-007), dịch đầy đủ title/goals/body/exercises(title, prompt, hints, explain)/check(q, options, explain); không chép starter/tests/reference.
- `node scripts/check-i18n.js lessons-db-3` → `OK — 2 mục đã dịch.` (script này chạy file qua `vm.runInNewContext`, nên cú pháp đã được chứng minh hợp lệ; `node --check` trực tiếp bị chặn bởi permission của phiên, không phải lỗi file).
- `node scripts/validate.js` hiện EXIT 1 vì lỗi CÓ SẴN không thuộc task: `sdlc.js: lỗi cú pháp/chạy: Unexpected token ')'` — `js/data/sdlc.js` đang ở trạng thái "M" trong working tree (do việc khác sửa, integrator sở hữu). Không đụng vào file đó. Cảnh báo `path.js: 37 bài học không nằm trong PATH` (có lesson-db-006/007) cũng là hiện trạng sẵn, ngoài phạm vi dịch.
Reviewed-by: check-i18n (translation, no LLM review)
