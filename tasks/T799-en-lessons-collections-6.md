# T799 — Dịch sang tiếng Anh: lessons-collections (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-collections-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-collections.js`: **lesson-collections-006**.

Viết vào `js/i18n/lessons-collections-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-collections-6.en.js` và `node scripts/check-i18n.js lessons-collections-6` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ `lesson-collections-006`: title, goals (4), body (toàn bộ 9 mục + 4 code block, comment trong code block đã dịch sang Anh), exercises (2 mục: title/prompt/hints/explain), check (3 mục: q/options/explain). Không chép starter/tests/reference.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~java`), thuật ngữ (modCount, fail-fast, weakly consistent…), tên class, số liệu; "### Liên hệ phỏng vấn" → "### Interview relevance" theo đúng khuôn các chunk lessons-collections-1..5 đã dịch.
- Nghiệm thu: `node scripts/check-i18n.js lessons-collections-6` → `OK — 1 mục đã dịch.` (script này chạy file qua `vm`, nên syntax đã được kiểm); `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo có sẵn ở q-java/q-system-design/q-scenario/path.js, không liên quan file này).
- `node --check js/i18n/lessons-collections-6.en.js` bị chặn bởi quy tắc quyền hạn shell của phiên này (không được phép thực thi), nên việc xác minh cú pháp dựa trên `check-i18n.js`. Không sửa file nào khác; `js/i18n/manifest.js` đã liệt kê `lessons-collections-6` từ trước.
Reviewed-by: check-i18n (translation, no LLM review)
