# T412 — Dịch sang tiếng Anh: quiz (19 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-15.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz.js`: **qz-english-001, qz-english-002, qz-english-003, qz-english-004, qz-english-005, qz-english-006, qz-english-007, qz-english-008, qz-devops-003, qz-devops-004, qz-devops-005, qz-devops-006, qz-devops-007, qz-devops-008, qz-kotlin-003, qz-kotlin-004, qz-kotlin-005, qz-kotlin-006, qz-kotlin-007**.

Viết vào `js/i18n/quiz-15.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-15.en.js` và `node scripts/check-i18n.js quiz-15` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 19/19 mục vào `js/i18n/quiz-15.en.js` (english-001..008, devops-003..008, kotlin-003..007), chỉ gồm q/options/explain, giữ nguyên markup, thứ tự options và code block; comment trong code block đã dịch.
- Bản chạy trước bị gián đoạn để lại một cụm tiếng Việt trong `qz-english-001` ("đang không biết") làm `check-i18n` báo lỗi; đã thay bằng cách diễn đạt tiếng Anh tương đương, không đổi ý.
- `node scripts/check-i18n.js quiz-15` → OK (19 mục); full `check-i18n` → OK (1204 mục); `node scripts/validate.js` → `OK — không có lỗi.`
