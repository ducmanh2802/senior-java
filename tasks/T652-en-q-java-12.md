# T652 — Dịch sang tiếng Anh: q-java (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-12.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-java.js`: **core-014, collections-027, collections-028, modern-025, modern-026, modern-027, core-032, core-033, core-034, collections-029, collections-030, modern-028, modern-029**.

Viết vào `js/i18n/q-java-12.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-java-12.en.js` và `node scripts/check-i18n.js q-java-12` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 13 mục (core-014, collections-027, collections-028, modern-025, modern-026, modern-027, core-032, core-033, core-034, collections-029, collections-030, modern-028, modern-029) vào `js/i18n/q-java-12.en.js`, đúng 3 field `q, a, follow`, giữ nguyên cấu trúc `###`, bảng, danh sách, `> Senior tip:`, toàn bộ markup `{{...}}` và `~~~java … ~~~` (code giữ nguyên, chỉ dịch comment tiếng Việt trong code block).
- Giữ đủ độ dài/độ chi tiết bản gốc, không tóm tắt, không thêm ý mới; thuật ngữ (HashMap, ConcurrentHashMap, W-TinyLFU, PECS, type erasure, pinning, RoundingMode…) và tên riêng/số liệu/đơn vị (ISO 4217, PCI DSS, HikariCP max 20, JEP 487/491) giữ nguyên.
- `node scripts/check-i18n.js q-java-12` → `OK — 13 mục đã dịch.` (script nạp file bằng `vm.runInNewContext` nên cú pháp JS đã được xác nhận hợp lệ). `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check js/i18n/q-java-12.en.js` bị chặn bởi permission của session (không cho chạy lệnh `node --check`), không phải lỗi code.
- core-014 cũng đã tồn tại trong `js/i18n/q-java-11.en.js`; task này liệt kê lại nên vẫn dịch, nội dung tương đương — file sau thắng khi deep-merge nên không xung đột.
- Không sửa file nào khác; `js/i18n/manifest.js` đã có sẵn entry `q-java-12`.
Reviewed-by: check-i18n (translation, no LLM review)
