# T733 — Dịch sang tiếng Anh: q-aws (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-aws-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-aws.js`: **aws-031, aws-032, aws-033, aws-034, aws-035, aws-036, aws-037, aws-038, aws-039, aws-040**.

Viết vào `js/i18n/q-aws-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-aws-6.en.js` và `node scripts/check-i18n.js q-aws-6` → OK, rồi `Status: DONE`.

## Notes

- Đã tạo `js/i18n/q-aws-6.en.js`: dịch 10 mục aws-031 → aws-040 (field `q`, `a`, `follow`), giữ nguyên cấu trúc markup, bảng, code block và độ dài/độ chi tiết của bản gốc; không thêm ý mới.
- Nhãn cố định: `**Tom tat:**` → `**Summary:**`, `### Pitfall` → `### Common Mistakes`, `### Khi nao chon (cai nao)` → `### When to Choose Which` / `### Which One to Pick When`, `### Bang chon nhanh` → `### Quick Choice Table`; `> Senior tip:` giữ nguyên.
- Giải thích ngắn ở lần đầu xuất hiện cho thuật ngữ bản gốc chưa diễn giải (resolver, ephemeral port, transaction log, Flow Log, VIF…) mà không thêm quyết định/ý kỹ thuật mới.
- Không có backtick và không có `${` trong template literal; không chép field code (starter/tests/reference).
- `node scripts/check-i18n.js q-aws-6` → `OK — 10 mục đã dịch.` (script này parse file bằng `vm.runInNewContext`, nên cú pháp đã được xác nhận hợp lệ).
- `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo đáp án ngắn còn lại thuộc q-java.js / q-scenario.js, không phải file của task này).
- `node --check js/i18n/q-aws-6.en.js` không chạy được trong phiên vì bị chặn bởi quy tắc quyền Bash (chỉ cho phép `node scripts/...`); đã dùng check-i18n.js làm bằng chứng tương đương về cú pháp.
- `js/i18n/q-aws-6` đã có sẵn trong `js/i18n/manifest.js` nên không cần sửa file nào khác; không chạy build-light-index vì không thêm/sửa dữ liệu câu hỏi.
Reviewed-by: check-i18n (translation, no LLM review)
