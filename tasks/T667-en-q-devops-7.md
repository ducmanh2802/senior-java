# T667 — Dịch sang tiếng Anh: q-devops (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-036, devops-037, devops-038, devops-039, devops-040, devops-041**.

Viết vào `js/i18n/q-devops-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-7.en.js` và `node scripts/check-i18n.js q-devops-7` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 6/6 mục (devops-036 → devops-041) vào `js/i18n/q-devops-7.en.js`; file đã có sẵn trong `js/i18n/manifest.js` nên không sửa file khác.
- `node scripts/check-i18n.js q-devops-7` → `OK — 6 mục đã dịch.` (script này chạy `vm.runInNewContext` trên toàn file nên đồng thời xác nhận file parse hợp lệ — tương đương `node --check`).
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js có từ trước, không liên quan).
- Ghi chú môi trường: lệnh `node --check <file>` bị chặn bởi permission prompt trên máy này nên không chạy trực tiếp được; đã dùng check-i18n (vm parse) thay thế.
- Không chạy build-light-index vì không sửa `js/data/*`. Không git commit.
Reviewed-by: check-i18n (translation, no LLM review)
