# T653 — Dịch sang tiếng Anh: q-java (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-java.js`: **modern-030**.

Viết vào `js/i18n/q-java-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-java-13.en.js` và `node scripts/check-i18n.js q-java-13` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch `modern-030` (q, a, follow) vào `js/i18n/q-java-13.en.js`; giữ đủ 6 mục `###` của đáp án, danh sách migrate 6 bước, 6 pitfall, `> Senior tip:` và toàn bộ markup (`{{...}}`, `###`, `- `, `1. `, `\\s`).
- `node scripts/check-i18n.js q-java-13` → `OK — 1 mục đã dịch.` (script này chạy file qua `vm.runInNewContext`, nên cú pháp JS đã được xác nhận hợp lệ).
- `node --check js/i18n/q-java-13.en.js` bị chặn bởi permission của session (không cho thực thi lệnh `node --check`), không phải do lỗi code.
- `node scripts/validate.js` vẫn báo LỖI nhưng **không có lỗi nào thuộc file của task này**: `.tmp-q2.txt`, `js/data/q-autotest.js` (syntax), `js/data/lessons-autotest.js` (3 lỗi markup/related) và `index-light.js` cũ — đều là sản phẩm đang làm dở của task autotest/companies khác. Không tự sửa vì ngoài quyền sở hữu (luật 3). Đề xuất người tích hợp dọn các file chưa khai báo manifest + chạy lại `node scripts/build-light-index.js` sau khi nhóm autotest xong.
- `node scripts/check-i18n.js` (toàn bộ) còn báo 2 lỗi ở `js/i18n/topics-1.en.js` (id `autotest`, `banking` không có trong header ids) — file của task khác, không đụng tới.
Reviewed-by: check-i18n (translation, no LLM review)
