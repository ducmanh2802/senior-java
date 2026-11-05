# T701 — Dịch sang tiếng Anh: lessons-devops (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-007**.

Viết vào `js/i18n/lessons-devops-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-5.en.js` và `node scripts/check-i18n.js lessons-devops-5` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `lesson-devops-007` sang `js/i18n/lessons-devops-5.en.js` (title, goals, body, 2 exercises: title/prompt/hints/explain, 3 câu check: q/options/explain). Không chép starter/tests/reference.
- Cấu trúc body giữ nguyên 1:1 với bản gốc: 7 heading `###`, 16 dòng bảng, 3 code block (text/yaml/java, 6 fence), 12 gạch đầu dòng; 12 bullet/list của prompt+explain bài tập cũng đủ. Nhãn `> Senior tip:` giữ nguyên, `### Liên hệ phỏng vấn` → `### Interview connection`.
- Trong code block chỉ dịch comment/chain string tiếng Việt (`# gồm cả lần gọi đầu tiên` → `# includes the very first call`, `"Payment tạm thời không sẵn sàng"` → `"Payment is temporarily unavailable"`); mọi identifier Resilience4j giữ nguyên.
- Kiểm tra: `node scripts/check-i18n.js lessons-devops-5` → `OK — 1 mục đã dịch.` (script này chạy file trong vm nên đồng thời xác nhận cú pháp đúng); `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check js/i18n/lessons-devops-5.en.js` bị chặn ở bước xin quyền chạy lệnh, nên chưa xác nhận bằng chính lệnh đó (đã xác nhận gián tiếp qua vm ở trên).
- File tạm `.tmp-probe.txt` tạo ở đầu phiên để thử encoding: `rm` bị chặn quyền, xin người tích hợp xoá giúp (không ảnh hưởng dữ liệu).
- Lưu ý cho các task dịch tiếp: công cụ đọc file trong phiên này hiển thị sai một số thuật ngữ tiếng Anh trong source (vd "window"/"breaker"/"call" bị biến dạng), text tiếng Việt vẫn đúng. Đã đối chiếu lại bằng grep trên đĩa: file nguồn `js/data/lessons-devops.js` không bị hỏng.

Reviewed-by: check-i18n (translation, no LLM review)
