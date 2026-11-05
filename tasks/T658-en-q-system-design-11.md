# T658 — Dịch sang tiếng Anh: q-system-design (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-system-design.js`: **architecture-029, architecture-030**.

Viết vào `js/i18n/q-system-design-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-system-design-11.en.js` và `node scripts/check-i18n.js q-system-design-11` → OK, rồi `Status: DONE`.

## Notes

- Xong: `js/i18n/q-system-design-11.en.js` chứa bản dịch `architecture-029`, `architecture-030` (chỉ 3 field `q`, `a`, `follow`).
- `node scripts/check-i18n.js q-system-design-11` → `OK — 2 mục đã dịch.` File này cũng được VM-thực thi trong chính check-i18n (lỗi cú pháp sẽ báo "không chạy được") nên cú pháp đã được xác nhận; lệnh `node --check js/i18n/q-system-design-11.en.js` bị chặn theo quyền chạy Bash trong phiên nên không gõ lại được.
- Giữ đúng cấu trúc gốc: số mục `###`, bảng 5 dòng + header, số cặp `{{…}}` (6 ở -029, 0 ở -030), khối `~~~text` và `~~~seq` (đã dịch sang ASCII, mọi bước ≤ 60 ký tự, 3 actor `Arch | Team | Spike`), nhãn `**Summary:**` và `> Senior tip:` theo quy ước.
- Số liệu: đổi dấu phân cách nghìn sang kiểu Anh (`1.800` → `1,800`) cho đúng văn phong EN, giá trị không đổi; escape `\$` giữ nguyên như bản gốc.
- **Không phải lỗi của task này** — `node scripts/validate.js` vẫn đỏ do worktree đang có việc của task khác làm dở:
  - `js/data/q-autotest.js: lỗi cú pháp/chạy: Unexpected token '{'` (T645/T646 đang ghi, file đang ở trạng thái `M`).
  - `lessons-autotest.js`: 5 `related` trỏ id câu hỏi `autotest-*` chưa tồn tại.
  - `index-light.js: đã cũ` — cần `node scripts/build-light-index.js`, nhưng em **không chạy** vì file này do task khác sở hữu và dữ liệu autotest đang viết dở (sẽ trộn thay đổi của người khác vào commit). Đề nghị integrator chạy lại build-light-index sau khi gộp xong nhóm task autotest.
  - `node scripts/check-i18n.js` (chạy toàn bộ) còn báo 2 lỗi ở `js/i18n/topics-1.en.js` (id `autotest`, `banking` không nằm trong danh sách `ids:` của file đó) — không liên quan chunk này; chunk của task này pass.
Reviewed-by: check-i18n (translation, no LLM review)
