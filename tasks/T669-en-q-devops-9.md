# T669 — Dịch sang tiếng Anh: q-devops (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-9.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-049, devops-051, devops-052**.

Viết vào `js/i18n/q-devops-9.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-9.en.js` và `node scripts/check-i18n.js q-devops-9` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 3 mục `devops-049`, `devops-051`, `devops-052` vào `js/i18n/q-devops-9.en.js` (field `q`, `a`, `follow`). File stub rỗng từ lần chạy trước được điền đầy đủ, giữ nguyên header `ids:`.
- Giữ nguyên toàn bộ markup (`**`, `{{...}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~hcl/yaml/bash/seq`); nhãn `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên; comment trong code block (kể cả `~~~seq` title/step) đã dịch sang tiếng Anh để không dính kiểm tra "còn tiếng Việt trong code".
- Không có backtick, không có `${`, không có field `starter/tests/reference/artifacts/code`.
- `node scripts/check-i18n.js q-devops-9` → `OK — 3 mục đã dịch.` (check này chạy file trong `vm`, tương đương xác nhận cú pháp hợp lệ).
- `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check js/i18n/q-devops-9.en.js` không chạy được trong phiên này (mệnh bị chặn quyền), nên dùng kết quả parse của `check-i18n.js` thay thế; integrator có thể chạy lại `node --check` nếu muốn.
- Chạy `node scripts/check-i18n.js` (toàn bộ) còn 2 lỗi **có sẵn từ trước, không thuộc file của task này**: `topics-1.en.js: id autotest / id banking không nằm trong danh sách ids của file` — đề xuất integrator bổ sung `autotest banking` vào dòng ` * ids:` của `js/i18n/topics-1.en.js` (file do task khác sở hữu).
- Một lỗi format nhỏ của bản gốc đã sửa khi dịch: hai bullet `**Ưu điểm** / **Lưu ý**` trong `devops-049` bị thụt 6 space (dễ bị render parser nối vào item trước); bản EN để thụt chuẩn `- `.
Reviewed-by: check-i18n (translation, no LLM review)
