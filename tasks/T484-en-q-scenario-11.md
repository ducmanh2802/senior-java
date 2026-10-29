# T484 — Dịch sang tiếng Anh: q-scenario (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-scenario.js`: **scenario-081, scenario-082, scenario-083, scenario-084, scenario-085, scenario-086**.

Viết vào `js/i18n/q-scenario-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-scenario-11.en.js` và `node scripts/check-i18n.js q-scenario-11` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 6 mục: scenario-081…086, chỉ gồm field `q`, `a`, `follow`.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, bảng, `~~~text/java/bash`), giữ số liệu, tên công cụ và thuật ngữ (CREATE INDEX CONCURRENTLY, lock_timeout, idempotency key, outbox, bus factor, ADR, MoSCoW…). Comment tiếng Việt trong code block (postmortem structure, velocity, characterization test, git diff) đã dịch sang tiếng Anh.
- Nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên. Không có mục "### Lưu ý khi phỏng vấn" trong 6 câu này.
- Không có backtick và không có `${` trong file; chuỗi dài dùng template literal.
- Kiểm tra: `node scripts/check-i18n.js q-scenario-11` → OK — 6 mục đã dịch; `node scripts/check-i18n.js` (toàn bộ) → OK — 1793 mục; `node scripts/validate.js` → OK — không có lỗi.
- Lưu ý môi trường: lệnh `node --check <file>` bị lớp quyền shell chặn trong phiên này, nên cú pháp được xác nhận qua `check-i18n.js` (script này nạp file bằng `vm.runInNewContext`, tức là parse toàn bộ file y như `--check`).
Reviewed-by: check-i18n (translation, no LLM review)
