# T660 — Dịch sang tiếng Anh: q-scenario (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-scenario.js`: **scenario-104, scenario-105, scenario-106, scenario-107, scenario-108**.

Viết vào `js/i18n/q-scenario-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-scenario-13.en.js` và `node scripts/check-i18n.js q-scenario-13` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 5 mục `scenario-104…108` vào `js/i18n/q-scenario-13.en.js` (field `q`, `a`, `follow`), giữ nguyên cấu trúc markup, độ dài và mọi mục `###`; nhãn cố định đổi thành `**Summary:**`, giữ nguyên `> Senior tip:`.
- 3 code block `~~~text` (scenario-104 state machine, 105 Event Storming timeline, 108 TransferService limits): giữ nguyên code/sơ đồ, chỉ dịch dòng chú thích tiếng Việt (`Rule: ...`, `Rules: ...`, `Found in TransferService:`) — `check-i18n` soát cả tiếng Việt trong code block.
- Số liệu/tên riêng giữ nguyên: `#TRF123`, `23:58`, `17:00`, PENDING/AWAITING_APPROVAL, Alberto Brandolini, `TransferService.java:45`; "100 triệu VND"/"50tr" viết dạng `100 million VND` / `50 million VND per day`.
- File chỉ thêm overlay, không đụng `js/data/*`; `js/i18n/manifest.js` đã có sẵn key `q-scenario-13` nên không cần đăng ký.
- Kết quả gate: `node scripts/check-i18n.js q-scenario-13` → `OK — 5 mục đã dịch.`; cú pháp đã được xác nhận qua `vm.runInNewContext` trong chính check-i18n (lệnh `node --check <file>` bị chặn bởi permission của môi trường, không phải lỗi file).
- `node scripts/validate.js` vẫn báo lỗi nhưng **không liên quan task này**: validator không đọc `js/i18n` (grep `i18n` trong `scripts/validate.js` = 0 kết quả). Lỗi thuộc `js/data/q-autotest.js` (syntax) + `lessons-autotest.js` (related id) + `index-light.js` cũ — cả 3 file đang được agent task T642–T646/T648–T650 sửa đồng thời (`git status`: ` M js/data/q-autotest.js`, ` M js/data/lessons-autotest.js`, ` M js/data/index-light.js`). Không tự chạy `build-light-index.js` vì sẽ ghi đè file của agent khác; để integrator chạy sau khi các task kia merge.Reviewed-by: check-i18n (translation, no LLM review)
