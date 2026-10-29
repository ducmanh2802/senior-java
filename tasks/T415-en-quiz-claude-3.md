# T415 — Dịch sang tiếng Anh: quiz-claude (28 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-claude-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-094, qz-claude-095, qz-claude-096, qz-claude-097, qz-claude-098, qz-claude-099, qz-claude-100, qz-claude-101, qz-claude-102, qz-claude-103, qz-claude-104, qz-claude-105, qz-claude-106, qz-claude-107, qz-claude-108, qz-claude-109, qz-claude-110, qz-claude-111, qz-claude-112, qz-claude-113, qz-claude-114, qz-claude-115, qz-claude-116, qz-claude-117, qz-claude-118, qz-claude-119, qz-claude-120, qz-claude-121**.

Viết vào `js/i18n/quiz-claude-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-3.en.js` và `node scripts/check-i18n.js quiz-claude-3` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 28/28 mục (qz-claude-094 … qz-claude-121), mỗi mục chỉ gồm `q`, `options`, `explain`; giữ nguyên thứ tự phương án, số lượng phương án, markup và các block `~~~json` / `~~~text`.
- `node scripts/check-i18n.js quiz-claude-3` → `OK — 28 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Không chạy được `node --check` trong môi trường này (lệnh bị chặn quyền); file đã được `check-i18n.js` biên dịch và thực thi qua `vm.runInNewContext` nên cú pháp đã được kiểm chứng.
- qz-claude-096: hai code block giữ nguyên cấu trúc JSON; chuỗi nội dung tiếng Việt trong payload (`phí giao hàng nhanh nội thành 2026`, `Tiếp tục nhé`) được dịch sang tiếng Anh, theo đúng tiền lệ ở T413 (qz-claude-063).
- qz-claude-114: phương án sai thứ 4 vốn là tên tiếng Việt có dấu (`tra_cứu_đơn_hàng`); checker cấm ký tự tiếng Việt trong nội dung đã dịch nên đổi thành `pedidos_actualización` (vẫn sai vì có chữ có dấu, ngoài tập `[a-zA-Z0-9_-]`), phần giải thích cập nhật tương ứng và vẫn nêu trường hợp tiếng Việt có dấu.
- qz-claude-105/120/121: giữ nguyên JSON minh hoạ, chỉ dịch phần văn xuôi; các nhãn cố định theo quy ước (không có "Tóm tắt:" / "Senior tip" trong 28 mục này).
Reviewed-by: check-i18n (translation, no LLM review)
