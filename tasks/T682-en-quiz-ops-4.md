# T682 — Dịch sang tiếng Anh: quiz-ops (28 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-ops.js`: **qz-devops-023, qz-devops-024, qz-devops-025, qz-devops-026, qz-devops-027, qz-devops-028, qz-devops-029, qz-devops-030, qz-devops-031, qz-devops-032, qz-devops-033, qz-devops-034, qz-devops-035, qz-devops-036, qz-devops-037, qz-devops-038, qz-devops-039, qz-devops-040, qz-devops-041, qz-devops-042, qz-devops-043, qz-devops-044, qz-devops-045, qz-devops-046, qz-devops-047, qz-devops-048, qz-devops-049, qz-devops-050**.

Viết vào `js/i18n/quiz-ops-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-ops-4.en.js` và `node scripts/check-i18n.js quiz-ops-4` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 28/28 mục (qz-devops-023 → 050) vào `js/i18n/quiz-ops-4.en.js`; file chỉ chứa field `q`, `options`, `explain`, giữ đúng số phần tử `options` theo từng mục (các mục multi: 024/027/030/036/047 có 5 options).
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `### Vì sao các phương án còn lại sai` → `### Why the other options are wrong`, `> Senior tip:` giữ nguyên; `### Cách xử lý` (043) → `### How to deal with it`.
- Markup giữ nguyên: `{{code}}`, bảng, `~~~bash|yaml|java|text|dockerfile`; comment/chain tiếng Việt trong code block đã dịch (023, 025, 026, 027, 029, 030, 031, 032, 034) để thoả quy tắc "không còn tiếng Việt trong code" của check-i18n.
- `node scripts/check-i18n.js quiz-ops-4` → `OK — 28 mục đã dịch.` (script này chạy file qua vm nên cũng xác nhận cú pháp hợp lệ; `node --check` bị chặn theo allowlist Bash của phiên này).
- `node scripts/validate.js` → OK — không có lỗi (cảnh báo q-english/path.js có từ trước, không thuộc file này). Không cần build-light-index vì không thêm/sửa dữ liệu câu hỏi.
- File đã đăng ký sẵn trong `js/i18n/manifest.js` (mục 'quiz-ops-4'), không sửa file nào khác.
Reviewed-by: check-i18n (translation, no LLM review)
