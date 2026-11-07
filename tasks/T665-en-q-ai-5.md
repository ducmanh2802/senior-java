# T665 — Dịch sang tiếng Anh: q-ai (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-ai-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-ai.js`: **ai-030, ai-031, ai-032**.

Viết vào `js/i18n/q-ai-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-ai-5.en.js` và `node scripts/check-i18n.js q-ai-5` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 3 mục `ai-030`, `ai-031`, `ai-032` với field `q`, `a`, `follow` (file chỉ là overlay theo id, không sửa dữ liệu gốc).
- Giữ nguyên cấu trúc markup và số dòng/mục con từng phần (tóm tắt, 6 mục `###`, các bullet/numbered list, `> Senior tip:`); nhãn `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên.
- Thuật ngữ giữ nguyên (RAG, BM25, ToolContext, bbox, structured output, straight-through rate, slopsquatting…); thêm chú giải ngắn 1 vế cho vài thuật ngữ lần đầu xuất hiện (ACL, prompt injection, golden set) vì người đọc chưa quen mảng AI — không thêm ý kỹ thuật mới.
- Không có backtick, không có `${`, không còn chữ tiếng Việt ngoài code block (file này không có code block).
- `node scripts/check-i18n.js q-ai-5` → `OK — 3 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (`node --check` bị chặn quyền trên máy, nhưng check-i18n đã parse+chạy file trong vm nên cú pháp hợp lệ). File đã có sẵn trong `js/i18n/manifest.js` nên không sửa file integrator.
Reviewed-by: check-i18n (translation, no LLM review)
