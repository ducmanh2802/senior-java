# T656 — Dịch sang tiếng Anh: q-security (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-security-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-security.js`: **security-025, security-026, security-027, security-028, security-029, security-030, security-031, security-032**.

Viết vào `js/i18n/q-security-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-security-5.en.js` và `node scripts/check-i18n.js q-security-5` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 8 mục security-025..032 (field `q`, `a`, `follow`) vào `js/i18n/q-security-5.en.js`; file chỉ là content overlay, không đụng `js/data/q-security.js`.
- `node scripts/check-i18n.js q-security-5` → `OK — 8 mục đã dịch.` (script này chạy thật file trong VM nên cú pháp đã được xác nhận hợp lệ; `node --check` bị chặn theo permission nên không chạy được trực tiếp).
- `node scripts/validate.js` đang báo LỖI nhưng **không phải do task này**: `js/data/companies.js` (lỗi cú pháp "Unexpected string") và `js/data/lessons-autotest.js` (lesson-autotest-006/007) đang bị sửa dở bởi work khác trên nhánh (`git status` cho thấy 2 file này modified), cùng cảnh báo `index-light.js` cũ và 21 bài học ngoài PATH. Không tự sửa vì nằm ngoài quyền sở hữu của T656 (luật 3). Integrator cần build-light-index sau khi các lỗi đó được xử lý.
Reviewed-by: check-i18n (translation, no LLM review)
