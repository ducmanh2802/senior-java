# T683 — Dịch sang tiếng Anh: quiz-gaps (20 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-gaps-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-gaps.js`: **qz-kotlin-018, qz-kotlin-019, qz-kotlin-020, qz-banking-001, qz-banking-002, qz-banking-003, qz-banking-004, qz-banking-005, qz-banking-006, qz-banking-007, qz-banking-008, qz-banking-009, qz-banking-010, qz-banking-011, qz-banking-012, qz-behavioral-015, qz-behavioral-016, qz-behavioral-017, qz-behavioral-018, qz-behavioral-019**.

Viết vào `js/i18n/quiz-gaps-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-gaps-4.en.js` và `node scripts/check-i18n.js quiz-gaps-4` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 20/20 mục vào `js/i18n/quiz-gaps-4.en.js` (q, options, explain; markup, code block và `> Senior tip:` giữ nguyên; comment tiếng Việt trong code block của qz-kotlin-020 đã dịch).
- `node scripts/check-i18n.js quiz-gaps-4` → `OK — 20 mục đã dịch.` (file chạy được trong VM nên cú pháp JS hợp lệ; `node --check` bị chặn bởi prompt quyền nên không chạy được).
- 3 mục qz-kotlin-018/019/020 trùng với phạm vi đã dịch sẵn trong `quiz-gaps-3.en.js`; giữ nguyên bản dịch để hai file nhất quán (overlay theo id, ghi đè cùng nội dung).
- `node scripts/validate.js` vẫn báo **1 lỗi không thuộc file của task này**: `q-devops.js: devops-063.a: inline code {{try (Resource r = ...) { ... }…}} chứa dấu { } lồng nhau`. File `js/data/q-devops.js` đang bị task khác (T581) sửa và nằm ngoài quyền sở hữu của T683 → không tự sửa. Ngoài ra chỉ còn cảnh báo có sẵn (q-english đáp án ngắn, 32 bài học ngoài PATH).
Reviewed-by: check-i18n (translation, no LLM review)
