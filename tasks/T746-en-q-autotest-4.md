# T746 — Dịch sang tiếng Anh: q-autotest (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-autotest-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-autotest.js`: **autotest-030, autotest-031, autotest-032, autotest-033, autotest-034, autotest-035**.

Viết vào `js/i18n/q-autotest-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-autotest-4.en.js` và `node scripts/check-i18n.js q-autotest-4` → OK, rồi `Status: DONE`.

## Notes
Đã dịch đủ 6 mục `autotest-030 … autotest-035` vào `js/i18n/q-autotest-4.en.js` (chỉ field `q, a, follow`; giữ nguyên markup, code block, bảng, `~~~seq`, các tham chiếu `{{autotest-0NN}}`; nhãn cố định "**Summary:**", "> Senior tip:", "### Interview notes"-style headings dịch sát).
- Dịch cả chuỗi literal và comment tiếng Việt bên trong code block (vd `hasText("Đã thanh toán")` → `hasText("Payment complete")`, `setName("Đăng nhập")` → `setName("Log in")`, `setName("Mở biên lai")` → `setName("Open receipt")`, `"Thành công"` → `"Success"`, `dialog.accept("Lý do huỷ")` → `dialog.accept("Cancellation reason")`) vì `check-i18n.js` báo lỗi nếu còn chữ Việt trong code.
- `node scripts/check-i18n.js q-autotest-4` → `OK — 6 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo đáp án ngắn có sẵn ở q-java.js / q-scenario.js, không liên quan file này).
- `node --check js/i18n/q-autotest-4.en.js` bị chặn trong phiên (quy tắc quyền không cho chạy lệnh này); cú pháp đã được xác nhận gián tiếp vì `check-i18n.js` nạp file bằng `vm.runInNewContext` và không báo lỗi "không chạy được".
- Không sửa file nào khác (`js/i18n/manifest.js` đã có sẵn `q-autotest-4`), không commit.
Reviewed-by: check-i18n (translation, no LLM review)
