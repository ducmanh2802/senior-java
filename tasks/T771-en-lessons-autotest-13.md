# T771 — Dịch sang tiếng Anh: lessons-autotest (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-autotest.js`: **lesson-autotest-015**.

Viết vào `js/i18n/lessons-autotest-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-autotest-13.en.js` và `node scripts/check-i18n.js lessons-autotest-13` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ `lesson-autotest-015`: title, goals (5), body (giữ nguyên 3 code block json/java/seq + 2 bảng, đã comment tiếng Việt trong code block sang tiếng Anh), exercises[0] (title, prompt, 7 hints, explain), check[0..3] (q, options, explain). Không chép starter/tests/reference.
- `node --check` trên file này bị chặn bởi permission harness (mệnh lệnh `node --check <path>` không được cho phép); syntax đã được xác nhận gián tiếp vì `node scripts/check-i18n.js lessons-autotest-13` nạp file bằng `vm.runInNewContext` → OK — 1 mục đã dịch.
- `node scripts/validate.js` → OK — không có lỗi (chỉ còn các cảnh báo độ dài đáp án có sẵn từ trước, không liên quan file này).
- Vài điều chỉnh cho người đọc EN: nhãn JSONPath pseudo-code `duongDan/tenKieuTrongSchema` → `path/schemaTypeName`, `giaTriMinimum` → `minimumValue`; rút 1 dòng seq `Pact -> CI` xuống < 60 ký tự theo ràng buộc diagram.
Reviewed-by: check-i18n (translation, no LLM review)
