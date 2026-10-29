# T418 — Dịch sang tiếng Anh: quiz-claude (22 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-claude-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-179, qz-claude-180, qz-claude-181, qz-claude-182, qz-claude-183, qz-claude-184, qz-claude-185, qz-claude-186, qz-claude-187, qz-claude-188, qz-claude-189, qz-claude-190, qz-claude-191, qz-claude-192, qz-claude-193, qz-claude-194, qz-claude-195, qz-claude-196, qz-claude-197, qz-claude-198, qz-claude-199, qz-claude-200**.

Viết vào `js/i18n/quiz-claude-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-6.en.js` và `node scripts/check-i18n.js quiz-claude-6` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 22/22 mục (qz-claude-179 → qz-claude-200) vào `js/i18n/quiz-claude-6.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain` — không chép `answer`, `topic`, `multi`.
- Giữ nguyên thứ tự và số lượng options (mục `multi` vẫn đủ 5 phương án), nên `answer` gốc vẫn khớp vị trí; nhãn "(Chọn 2)" → "(Choose 2)", "**Đúng:**" → "**Correct:**", "### Vì sao các phương án còn lại sai" → "### Why the other options are wrong" (theo đúng quy ước các file quiz-claude-1..5).
- Giữ nguyên markup: `**`, `{{code}}`, `###`, danh sách `- `, blockquote `>`, bảng trong qz-claude-199, code block `~~~json` trong qz-claude-189 (chỉ dịch chuỗi mô tả "Ảnh màn hình hiện tại" → "Current screenshot", không đổi cấu trúc JSON).
- Không có backtick, không có `${` trong nội dung; số liệu giữ nguyên giá trị, chỉ đổi dấu thập phân sang dạng tiếng Anh (0,1 → 0.1; 0,85 → 0.85) cho đồng bộ với các file dịch khác.
- Ưu tiên trung thành với bản gốc (không thêm ý, không rút gọn) theo yêu cầu dịch; các thuật ngữ (tool_use, tool_result, prompt injection, least privilege, defer_loading…) giữ nguyên tiếng Anh.
- Kiểm tra: `node scripts/check-i18n.js quiz-claude-6` → `OK — 22 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (`node --check` bị chặn quyền shell trên máy này, nhưng check-i18n nạp file bằng `vm.runInNewContext` nên cú pháp đã được parse thật).
- Chỉ sửa `js/i18n/quiz-claude-6.en.js` và file task này.
Reviewed-by: check-i18n (translation, no LLM review)
