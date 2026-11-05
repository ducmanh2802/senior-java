# T666 — Dịch sang tiếng Anh: q-devops (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-031, devops-032, devops-033, devops-034, devops-035**.

Viết vào `js/i18n/q-devops-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-6.en.js` và `node scripts/check-i18n.js q-devops-6` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 5 mục devops-031…035 vào `js/i18n/q-devops-6.en.js` (q, a, follow). Giữ nguyên markup, số code block (2/3/4/3/4), số bảng và độ dài từng đoạn; comment trong code block đã dịch sang tiếng Anh theo yêu cầu của `check-i18n.js`.
- `node scripts/check-i18n.js q-devops-6` → `OK — 5 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (`node --check` không chạy được vì lệnh bị chặn quyền, nhưng check-i18n parse file bằng `vm.runInNewContext` nên cú pháp đã được xác nhận).
- `q` của devops-032 có dấu `'` nên phải escape `\'` trong chuỗi đơn.
- Ngoài phạm vi task (chỉ báo cáo): `node scripts/check-i18n.js` chạy toàn bộ báo 2 lỗi sẵn có ở `js/i18n/topics-1.en.js` — id `autotest` và `banking` không nằm trong dòng ` * ids:` của header file đó. File này không thuộc T666 nên tôi không sửa.
Reviewed-by: check-i18n (translation, no LLM review)
