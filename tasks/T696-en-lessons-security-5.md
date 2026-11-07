# T696 — Dịch sang tiếng Anh: lessons-security (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-security.js`: **lesson-security-006**.

Viết vào `js/i18n/lessons-security-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-security-5.en.js` và `node scripts/check-i18n.js lessons-security-5` → OK, rồi `Status: DONE`.

## Notes

Đã dịch xong `js/i18n/lessons-security-5.en.js` cho `lesson-security-006`: title, goals (4), body (toàn bộ, không rút gọn), exercises[0] (title/prompt/hints/explain), check[0..2] (q/options/explain). Không chép starter/tests/reference.

Giữ nguyên markup: `###`, `**`, `{{code}}`, bảng `|`, `~~~text`, `~~~java`, `~~~seq`. Phần chữ trong seq block đã dịch sang Anh và vẫn hợp lệ cho `js/core/diagram.js` (3 actor, mỗi bước ≤ 60 ký tự); comment tiếng Việt trong `~~~java` cũng đã dịch. `answer` của 3 câu check giữ nguyên index như bản gốc.

**Kết quả cổng kiểm** (Bash bị chặn ở vài lời gọi đầu, đã chạy lại được sau đó):
- `node scripts/check-i18n.js lessons-security-5` → `OK — 1 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn các cảnh báo cũ của `q-java.js` và `path.js`, không liên quan file này; không sửa file dữ liệu nên không cần chạy `build-light-index.js`).
- `node --check js/i18n/lessons-security-5.en.js` → bị từ quyền thực thi, nhưng không cần thiết: `check-i18n.js` đã `vm.runInNewContext` chính file này và không báo "không chạy được", tương đương bằng chứng cú pháp hợp lệ.

Đã kiểm tĩnh thêm: id `lesson-security-006` trùng danh sách `ids:` ở header; chỉ dùng field được phép (title/goals/body/exercises/check); 12 dấu backtick = 6 cặp template literal, không có backtick nào nằm trong chuỗi; không có `${`; không còn chữ có dấu tiếng Việt kể cả trong code block; không có chuỗi nào bằng đúng `starter|tests|reference|artifacts|code`. File đã có sẵn trong `js/i18n/manifest.js` nên manifest không cần đổi.
Reviewed-by: check-i18n (translation, no LLM review)
