# T1254R — Fact-check nội dung mới của T1254

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1254 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã rà soát nội dung mới thêm trong T1254 (diff HEAD, `js/data/q-java.js`): `modern-001`…`modern-007` (phần "Ví dụ đời thực"/"Trả lời mẫu khi phỏng vấn" được bổ sung). Kiến thức chính (Stream lazy/stateful, ForkJoinPool.commonPool, quy tắc N*Q, Optional semantics, record/JPA, sealed+pattern matching exhaustiveness, lộ trình migrate 8→11→17→21, `var`/text block/switch expression, functional interface/lambda) phù hợp chuẩn Java 17/21; không thấy API/flag bịa, mặc định sai hay cơ chế nói ngược cần chỉnh.
- Sửa lỗi chữ/diễn đạt gây sai nghĩa trong nội dung mới:
  - `modern-003`: sửa "record là final nên khôngsubclass được" → "record là final nên không thể tạo subclass được" (tránh chữ ghép nước ngoài/lỗi gõ, giữ đúng ý Hibernate không tạo proxy subclass được).
  - `modern-006`: sửa "Selector null nesses NPE..." (lỗi gõ/garbled) → "Selector là null sẽ gây NPE nếu không có {{case null}}." (đúng hành vi switch pattern/selector null).
- Kiểm tra: không có backtick trong template literal, `${` trong code block YAML mẫu đã escape `\${{...}}`.
- Đã chạy `node scripts/build-light-index.js` (theo AGENTS 2.6 khi sửa câu hỏi; file `js/data/index-light.js` được sinh lại) và `node --check js/data/q-java.js`.
- `node scripts/validate.js` → OK (có cảnh báo sẵn có: `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`).
- Không chạy `node scripts/test-lessons.js` (task không sửa bài học; owns chỉ `js/data/q-java.js`). Không git commit. Không mở trình duyệt/kill process.
