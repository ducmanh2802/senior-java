# T764 — Dịch sang tiếng Anh: lessons-autotest (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-autotest.js`: **lesson-autotest-008**.

Viết vào `js/i18n/lessons-autotest-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-autotest-6.en.js` và `node scripts/check-i18n.js lessons-autotest-6` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `lesson-autotest-008` vào `js/i18n/lessons-autotest-6.en.js` (file trước đó chỉ là stub rỗng). Đủ field: title, goals (5), body, exercises[0] (title/prompt/hints 5/explain), check (4 câu x 4 options + explain). Giữ đúng thứ tự và số phần tử mảng, không chép starter/tests/reference.
- Giữ nguyên chuỗi mà test của bài tập so sánh: `label + ": khong duoc null"` và khối `~~~text` mẫu `3 fail:` (đúng quy ước như lessons-autotest-3.en.js đã giữ `Cot khong ton tai:`) — dịch chúng sẽ làm learner fail harness.
- Trong code block chỉ dịch comment tiếng Việt; giữ nguyên literal/API (`can it nhat 5 phan tu trong danh sach`, `Paths.get("artifacts/video")`, `hasTitle(...)`, `{{\\"user\\": ...}}`). Hai khối minh hoạ thuần log/XML (`Lần chạy 1...`, testcase names) dịch sang Anh vì không phải hợp đồng với test.
- Markup giữ nguyên: 7 heading `###` (dùng "### Interview relevance" như các file autotest khác), 10 code block (9 + 1 `~~~seq`, đã dịch label/note, giữ actor `Test | XML | CI | Allure`), bảng 4 dòng, `**Summary:**`, `> Senior tip:`.
- Kiểm: `node scripts/check-i18n.js lessons-autotest-6` → OK — 1 mục đã dịch (chạy trong vm nên file đã parse được); `node scripts/validate.js` → OK — không có lỗi. `node --check` bị chặn theo allow-list của Bash nên dùng check-i18n (vm.runInNewContext) làm bằng chứng cú pháp.
- Không sửa file nào khác; `js/i18n/manifest.js` đã có sẵn entry `lessons-autotest-6` nên không cần đăng ký.

Reviewed-by: check-i18n (translation, no LLM review)
