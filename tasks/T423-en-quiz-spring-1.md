# T423 — Dịch sang tiếng Anh: quiz-spring (20 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-spring-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-spring.js`: **qz-spring-007, qz-spring-008, qz-spring-009, qz-spring-010, qz-spring-011, qz-spring-012, qz-spring-013, qz-spring-014, qz-spring-015, qz-spring-016, qz-spring-017, qz-spring-018, qz-spring-019, qz-spring-020, qz-jpa-007, qz-jpa-008, qz-jpa-009, qz-jpa-010, qz-jpa-011, qz-jpa-012**.

Viết vào `js/i18n/quiz-spring-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-spring-1.en.js` và `node scripts/check-i18n.js quiz-spring-1` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 20/20 mục (14 qz-spring-007…020 + 6 qz-jpa-007…012) vào `js/i18n/quiz-spring-1.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain`; markup (`**`, `{{code}}`, `###`, `~~~lang`, bảng) giữ nguyên, code block giữ code và dịch comment/literal tiếng Việt minh hoạ.
- Số liệu đổi sang định dạng tiếng Anh theo tiền lệ các file `.en.js` khác: 5.000 → 5,000; 0,3 s → 0.3 s; 200.000 → 200,000; 70.000 → 70,000.
- Kiểm tra: `node scripts/check-i18n.js quiz-spring-1` → `OK — 20 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (checker chạy file qua vm nên cũng xác nhận cú pháp; lệnh `node --check` bị chặn quyền trong phiên này).
- Không sửa file nào khác; `js/i18n/manifest.js` đã có sẵn `quiz-spring-1`.
Reviewed-by: check-i18n (translation, no LLM review)
