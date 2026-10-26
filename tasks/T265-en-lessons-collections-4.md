# T265 — Dịch sang tiếng Anh: lessons-collections (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-collections-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-collections.js`: **lesson-collections-005**.

Viết vào `js/i18n/lessons-collections-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-collections-4.en.js` và `node scripts/check-i18n.js lessons-collections-4` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đầy đủ **lesson-collections-005** vào `js/i18n/lessons-collections-4.en.js`: title, goals, body, 2 exercises (title/prompt/hints/explain) và 3 check (q/options/explain), giữ nguyên markup, bảng, blockquote, code block (chỉ dịch comment tiếng Việt trong code).
- Không chép starter/tests/reference (overlay merge theo index giữ nguyên các field code); index `answer` của check không chép nên giữ đúng phương án gốc (1/2/1).
- Đã chạy: `node --check` OK; `node scripts/check-i18n.js lessons-collections-4` → `OK — 1 mục đã dịch`; chạy cả bộ i18n → `OK — 905 mục đã dịch`. Đã test merge bằng Node: overlay áp đúng trường, code giữ nguyên.
- `node scripts/validate.js` (chỉ quét js/data, không đọc i18n) còn 3 lỗi **không thuộc file của task này**, do agent khác đang chạy song song: `lessons-devops.js` lỗi cú pháp (làm path.js báo thiếu lesson-devops-001..003) và `algo.js: algo-098.solution` có `{{...}}` lồng nhau. Không sửa vì luật 3 (chỉ sửa file sở hữu); các file này đang Modified trong git bởi task khác.
