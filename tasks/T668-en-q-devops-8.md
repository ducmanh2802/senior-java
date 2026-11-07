# T668 — Dịch sang tiếng Anh: q-devops (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-042, devops-043, devops-044, devops-045, devops-046, devops-047, devops-048**.

Viết vào `js/i18n/q-devops-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-8.en.js` và `node scripts/check-i18n.js q-devops-8` → OK, rồi `Status: DONE`.

## Notes

DONE — đã dịch đủ 7 mục (devops-042…devops-048) vào `js/i18n/q-devops-8.en.js`, mỗi mục gồm `q`, `a`, `follow`; giữ nguyên markup, bảng, code block (comment trong code block đã dịch sang tiếng Anh để `check-i18n.js` không báo), nhãn "**Summary:**", "> Senior tip:", số liệu/tên riêng/thuật ngữ giữ nguyên. File đã có trong `js/i18n/manifest.js` nên không phải đăng ký thêm.

Kiểm tra: `node scripts/check-i18n.js q-devops-8` → `OK — 7 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (file được parse/exec trong check-i18n nên cú pháp đã được xác minh; `node --check` không chạy được vì lệnh bị chặn trong quyền Bash). Không commit.
Reviewed-by: check-i18n (translation, no LLM review)
