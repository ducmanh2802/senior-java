# T688 — Dịch sang tiếng Anh: lessons-core (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-core-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-core.js`: **lesson-core-007**.

Viết vào `js/i18n/lessons-core-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-core-3.en.js` và `node scripts/check-i18n.js lessons-core-3` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `lesson-core-007` (title, goals, body, exercises[0]: title/prompt/hints/explain, check[0..3]: q/options/explain). Không chép starter/tests/reference.
- `node scripts/check-i18n.js lessons-core-3` → `OK — 1 mục đã dịch.` Script này nạp file bằng `vm.runInNewContext`, nên cú pháp đã được kiểm chứng (lệnh `node --check` bị chặn bởi permission prompt trong phiên này).
- Đối xứng markup với bản gốc: 93 cặp `{{ }}` và 8 fence `~~~` ở cả hai bên; comment/chuỗi tiếng Việt trong code block đã dịch (`"Could not load order "`, `// everything lost…`).
- `node scripts/validate.js` vẫn exit 1 vì lỗi **có sẵn từ file khác**, không liên quan bài này: `lessons-devops.js: lesson-devops-013` (lệch `{{}}`, ký tự Trung Quốc "这类"/"副本") và `index-light.js: đã cũ`. Không tự sửa/tự chạy `build-light-index.js` vì các file đó thuộc integrator và đang có thay đổi dở của agent khác trong worktree.
Reviewed-by: check-i18n (translation, no LLM review)
