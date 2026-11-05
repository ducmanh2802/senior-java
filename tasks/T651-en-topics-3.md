# T651 — Dịch sang tiếng Anh: topics (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/topics-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/topics.js`: **banking, autotest**.

Viết vào `js/i18n/topics-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **name, group**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/topics-3.en.js` và `node scripts/check-i18n.js topics-3` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch 2 mục trong `js/i18n/topics-3.en.js` (chỉ field `name`, `group`):
  `banking` → "Banking Domain for Developers" / Architecture, `autotest` → "Automation Testing (QA → SDET)" / Soft skills.
  `node scripts/check-i18n.js topics-3` → `OK — 2 mục đã dịch.` (script này chạy thật file qua `vm`, nên cú pháp đã được xác nhận;
  `node --check` bị chặn quyền nên không chạy được trực tiếp).
- Trùng lặp: `topics-1.en.js` (T158) đã chứa sẵn 2 id này với cùng bản dịch. `manifest.js` liệt kê `topics-1` trước `topics-3`
  nên bản của topics-3 là bản thắng thế — giá trị giống hệt nên không khác biệt hành vi. Đề xuất integrator: về sau mỗi id
  chỉ nên nằm trong một chunk, hoặc bỏ 2 dòng trùng ở `topics-1.en.js`.
- `node scripts/validate.js` vẫn báo LỖI, nhưng **không do file của task này**. Nguyên nhân từ công việc đang chạy song song
  trên chủ đề `autotest` (mtime `js/data/q-autotest.js` = 18:55, validate chạy 18:56):
  - `js/data/.tmp-q2.txt` — file tạm chưa khai báo trong `js/core/data-manifest.js`.
  - `q-autotest.js: lỗi cú pháp/chạy: Unexpected end of input` — file bị cắt giữa chừng.
  - `lessons-autotest.js: lesson-autotest-001: related "autotest-001" không phải id câu hỏi có thật` — hệ quả của file trên.
  - `index-light.js đã cũ` — sẽ hết lỗi sau khi dữ liệu autotest hoàn tất và chạy `node scripts/build-light-index.js`.
  Không sửa các file này vì không thuộc quyền sở hữu của T651.
Reviewed-by: check-i18n (translation, no LLM review)
