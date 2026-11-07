# T703 — Dịch sang tiếng Anh: lessons-devops (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-010**.

Viết vào `js/i18n/lessons-devops-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-7.en.js` và `node scripts/check-i18n.js lessons-devops-7` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch `lesson-devops-010` (HPA algorithm) vào `js/i18n/lessons-devops-7.en.js`: title, goals (4), body (đủ 9 mục `###` + `> Senior tip:`, bảng 4 dòng, 3 code block seq/java/yaml), exercises[0] (title/prompt 5 bước + ghi ý, 4 hints, explain), check[0..3] (q + 4 options giữ đúng thứ tự để `answer` index không đổi + explain). Không chép starter/tests/reference.
- Comments trong code block đã dịch sang tiếng Anh (kể cả sơ đồ `~~~seq` vốn viết ASCII không dấu trong bản gốc); markup giữ nguyên; không còn ký tự tiếng Việt nào.
- `node scripts/check-i18n.js lessons-devops-7` → `OK — 1 mục đã dịch.` (script này nạp file bằng `vm.runInNewContext`, nên cú pháp JS đã được kiểm chứng — lệnh `node --check` riêng bị chặn quyền chạy Bash trong phiên này).
- `node scripts/validate.js` vẫn exit 1 vì lỗi **có sẵn, không thuộc file của task**: `q-soft.js` chứa ký tự nước ngoài lẫn trong prose tiếng Việt — dòng 3744 `và 회의 (họp)`, dòng 3816 `không依 vào lời hứa miệng`, và `behavioral-043.a` bị báo chứa `こと`. Task này chỉ sở hữu file i18n, không sửa `js/data/q-soft.js`, và không thêm/sửa dữ liệu nên không chạy `build-light-index.js` (sẽ ghi đè file của integrator). Đề xuất integrator: sửa 3 chỗ đó thành `họp`, `không dựa vào`, `điều` rồi chạy `node scripts/build-light-index.js`.
- `js/i18n/manifest.js` đã có sẵn entry `'lessons-devops-7'` (dòng 90) — không cần đăng ký thêm.
- Không chạy `node scripts/stale-i18n.js`: lệnh treo quá timeout mặc định; không thuộc gate của task.
Reviewed-by: check-i18n (translation, no LLM review)
