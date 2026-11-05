# T673 — Dịch sang tiếng Anh: q-soft (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-soft.js`: **testing-025, testing-026, testing-027, testing-028, testing-029, testing-030**.

Viết vào `js/i18n/q-soft-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-soft-8.en.js` và `node scripts/check-i18n.js q-soft-8` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 6 mục `testing-025 … testing-030` vào `js/i18n/q-soft-8.en.js` (chỉ field `q`, `a`, `follow`); file đã có trong `js/i18n/manifest.js` nên không cần sửa gì khác.
- Giữ nguyên cấu trúc markup của bản gốc: toàn bộ heading `###`, bảng `|`, `~~~java` / `~~~bash` / `~~~seq`, bullet/number, `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên, tên service/số liệu/version không đổi.
- Trong code block: chỉ dịch comment + label trong `~~~seq` (giữ nguyên actor name và cú pháp `A -> B:`), code giữ nguyên; đã kiểm tra không còn ký tự tiếng Việt (check-i18n quét cả trong code).
- Nhãn bảng "@Scheduled" và bảng isolation/bẫy giữ đúng số dòng như bản gốc (kể cả chỗ bản gốc không có dòng `|---|`).
- Verify: `node scripts/check-i18n.js q-soft-8` → `OK — 6 mục đã dịch.` (script này chạy file trong VM nên đồng thời là kiểm tra cú pháp); `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check js/i18n/q-soft-8.en.js` không chạy được vì quyền Bash trong phiên này chỉ cho phép lệnh `node scripts/...`; đã dùng check-i18n (parse + execute) thay thế.
- Không commit, không sửa file ngoài quyền sở hữu.

Reviewed-by: check-i18n (translation, no LLM review)
