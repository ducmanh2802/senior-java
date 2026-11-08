# T929R — Fact-check nội dung mới của T929

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T929 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Baseline: `node --check js/data/q-scenario.js` OK; `node scripts/validate.js` OK (có 2 cảnh báo có sẵn không thuộc file này: `q-java.js modern-033` ngắn, `path.js` 6 bài học ngoài PATH).
- Đã chạy `node scripts/build-light-index.js` (bắt buộc khi sửa câu hỏi) rồi `node scripts/validate.js` → OK. `js/data/index-light.js` được cập nhật bởi build script theo quy trình chuẩn (không chỉnh tay).
- Kiểm tra diff `q-scenario.js` (phần T929 mới): `scenario-099` → `scenario-104` (6 câu). Kỹ thuật nhìn chung đúng (transaction giữ connection, outbox/idempotency, try-with-resources/timeout, equals-hashCode/mutable key, retry backoff/jitter/idempotency, legacy/hotfix/release). Không thấy API bịa hay cơ chế nói ngược; ví dụ số liệu được trình bày như kịch bản minh họa, không mâu thuẫn.
- Sửa markup/cú pháp: loại bỏ ký tự backtick bị escape nhầm trong prose/code block (`\`{{...}}\``, fence 4 backtick do escape) ở `scenario-099..102` để tuân thủ markup `{{code}}` và tránh ký tự backtick thừa trong template literal; chuẩn hóa code block dùng `~~~java`.
- Sửa chữ/nội dung dễ gây hiểu nhầm: `scenario-099` đổi "code block 4 backticks" (tiếng Anh lẫn) thành mô tả markup đúng; viết lại `a` của `scenario-099..104` cho chi tiết, dễ hiểu với dev ~4 năm ít tiếp xúc công nghệ, giải thích thuật ngữ lần đầu (outbox, connection leak, idempotency key, FD, thundering herd, characterization/regression test, monolith, CR/CAB/SLA/freeze window...) và giữ cấu trúc yêu cầu (Tóm tắt, cơ chế/vì sao, ví dụ đời thực/số liệu, pitfall, Trả lời mẫu khi phỏng vấn, Senior tip). Không thêm/xoá mục/câu, không sửa nội dung đã có ở HEAD.
