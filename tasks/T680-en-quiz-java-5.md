# T680 — Dịch sang tiếng Anh: quiz-java (14 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-core-021, qz-core-022, qz-core-023, qz-core-024, qz-collections-021, qz-collections-022, qz-collections-023, qz-collections-024, qz-modern-021, qz-modern-022, qz-modern-023, qz-modern-024, qz-concurrency-021, qz-concurrency-022**.

Viết vào `js/i18n/quiz-java-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-5.en.js` và `node scripts/check-i18n.js quiz-java-5` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 14/14 mục trong `js/i18n/quiz-java-5.en.js` (field `q`, `options`, `explain`), theo đúng markup gốc;
  nhãn cố định đổi thành `**Correct answer:**` / `### ...` giữ nguyên cấu trúc, `> Senior tip:` giữ nguyên.
- Các bảng/trace trong `~~~text` và comment trong `~~~java` đều được dịch (không còn dấu tiếng Việt — kể cả `đ`),
  số liệu/đơn vị giữ nguyên; `\\u3000`, `\\t`, `\\s`, `\\` escape theo đúng bản gốc.
- `q` của mục `multi` đổi "(Chọn 2)/(Chọn 3)" → "(Choose 2)/(Choose 3)" theo khuôn `quiz-java-4.en.js`.
- `node scripts/check-i18n.js quiz-java-5` → `OK — 14 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- File đã có trong `js/i18n/manifest.js` (dòng 292) nên không phải đăng ký thêm.
- `node --check js/i18n/quiz-java-5.en.js` bị chặn bởi lớp phê duyệt lệnh trong phiên này (4 lần thử đều không được
  cấp quyền). Cú pháp/nội dung đã được xác minh tương đương bằng `check-i18n.js`, vốn nạp file qua `vm.runInNewContext`
  và sẽ báo "không chạy được" nếu file không parse được. Không có lỗi.
- Không sửa file nào khác. `check-i18n.js` chạy toàn bộ (không kèm tên chunk) còn báo 2 lỗi cũ ở `topics-1.en.js`
  (`autotest`, `banking` không có trong danh sách ids của header file đó) — không thuộc phạm vi T680, đề xuất integrator
  chỉ thêm hai id vào header hoặc sang một file topics riêng.
Reviewed-by: check-i18n (translation, no LLM review)
