# T431 — Dịch sang tiếng Anh: quiz-ops (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-ops.js`: **qz-primer-004, qz-primer-005, qz-primer-006, qz-primer-007, qz-primer-008, qz-primer-009, qz-primer-010**.

Viết vào `js/i18n/quiz-ops-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-ops-3.en.js` và `node scripts/check-i18n.js quiz-ops-3` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 7 mục (qz-primer-004 → 010), chỉ gồm `q`, `options`, `explain`; giữ nguyên `{{code}}`, bảng, `~~~` block, các nhãn "**Summary:**", "### Why the other options are wrong", "> Senior tip:".
- Comment tiếng Việt trong code block (bash/java/text) đã dịch sang tiếng Anh; số liệu, PID, version giữ nguyên (21345, 8080, Jackson 2.15/2.17, TTL 10m…).
- Không có backtick, không có `${`; không chép lại field code nào.
- `node scripts/check-i18n.js quiz-ops-3` → `OK — 7 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý shell: môi trường hiện chặn lệnh có flag (`node --check …` bị từ chối quyền), nên kiểm cú pháp qua `check-i18n.js` — script này nạp file bằng `vm.runInNewContext`, file lỗi cú pháp sẽ bị báo ngay; kết quả OK nghĩa là file parse sạch.
- `js/i18n/manifest.js` đã có sẵn `'quiz-ops-3'` (không cần sửa, file của integrator).
Reviewed-by: check-i18n (translation, no LLM review)
