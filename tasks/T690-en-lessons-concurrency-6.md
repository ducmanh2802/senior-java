# T690 — Dịch sang tiếng Anh: lessons-concurrency (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-concurrency-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-concurrency.js`: **lesson-concurrency-007**.

Viết vào `js/i18n/lessons-concurrency-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-concurrency-6.en.js` và `node scripts/check-i18n.js lessons-concurrency-6` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch trọn `lesson-concurrency-007` (title, goals, body, 2 exercises: title/prompt/hints/explain, 4 câu check: q/options/explain) vào `js/i18n/lessons-concurrency-6.en.js`. Không chép starter/tests/reference/answer.
- `node scripts/check-i18n.js lessons-concurrency-6` → `OK — 1 mục đã dịch.` (script này chạy file qua vm, đồng nghĩa đã qua kiểm tra cú pháp; `node --check <file>` bị chặn theo cấu hình Bash permissions của phiên nên không chạy được trực tiếp).
- Comment trong code block (`~~~java`, `~~~text`) đã dịch sang tiếng Anh, giữ nguyên cấu trúc diagram.
- **Người ngoài task sửa `node scripts/validate.js` → exit 1**: `sdlc.js: lỗi cú pháp/chạy: Unexpected token ')'`. File `js/data/sdlc.js` không thuộc quyền sở hữu của T690 (thuộc T604/T638/T715…), lỗi có sẵn từ commit `632ec1e Content: T638`, không liên quan tới thay đổi của task này. Đề xuất: task owner của sdlc.js sửa syntax; các warning "đáp án ngắn" và "bài học không nằm trong PATH" cũng có sẵn từ trước.
- Không có file nào khác bị thay đổi.
Reviewed-by: check-i18n (translation, no LLM review)
