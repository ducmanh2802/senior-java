# T687 — Dịch sang tiếng Anh: lessons-core (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-core-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-core.js`: **lesson-core-006**.

Viết vào `js/i18n/lessons-core-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-core-2.en.js` và `node scripts/check-i18n.js lessons-core-2` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch trọn `lesson-core-006` sang `js/i18n/lessons-core-2.en.js`: title, goals (3), body (10 heading, 7 code block, 1 bảng 3 dòng, 1 blockquote, list 5 mục equals, 2 bullet thiết kế, 6 bullet pitfall — đủ như bản gốc), exercises[0] (title/prompt/hints 3/explain), check[0..3] (q/options 4/explain). Không chép starter/tests/reference.
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `### Liên hệ phỏng vấn` → `### Interview notes`. Comment và chuỗi tiếng Việt bên trong code block (`~~~java`, `~~~text`) đã dịch; số liệu, tên riêng, thuật ngữ (HashMap, ISO 4217, consistent with equals) giữ nguyên.
- Kiểm: `node scripts/check-i18n.js lessons-core-2` → OK — 1 mục đã dịch (script parse + chạy file trong VM nên cú pháp đã được xác nhận; `node --check` bị chặn theo cấu hình permission của phiên này). `node scripts/validate.js` → OK — không có lỗi (chỉ còn cảnh báo cũ của file khác). Không sửa file nào ngoài file task sở hữu, không commit.
Reviewed-by: check-i18n (translation, no LLM review)
