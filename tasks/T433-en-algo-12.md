# T433 — Dịch sang tiếng Anh: algo (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-12.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/algo.js`: **algo-028, algo-029, algo-030, algo-031, algo-032, algo-033, algo-034, algo-084**.

Viết vào `js/i18n/algo-12.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **prompt, hints, solution, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/algo-12.en.js` và `node scripts/check-i18n.js algo-12` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 8 mục (algo-028 → algo-034, algo-084) trong `js/i18n/algo-12.en.js`, chỉ gồm `prompt, hints, solution, follow`; code trong `~~~java` giữ nguyên, chỉ comment tiếng Việt được dịch (hoặc giữ comment tiếng Anh vốn có).
- Giữ đúng markup (`**`, `{{code}}`, `###`, danh sách, `> Senior tip:`); nhãn dịch: `### Ví dụ` → `### Example`, `### Ràng buộc` → `### Constraints`, `### Ý tưởng` → `### Approach`, `### Lưu ý khi phỏng vấn` → `### Interview notes`.
- `node scripts/check-i18n.js algo-12` → `OK — 8 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check` bị sandbox chặn quyền chạy; file đã được `check-i18n.js` nạp qua `vm.runInNewContext` nên cú pháp đã được xác nhận hợp lệ.
- `js/i18n/manifest.js` đã có sẵn `algo-12` nên không phải sửa file khác.
Reviewed-by: check-i18n (translation, no LLM review)
