# T1575R — Fact-check nội dung mới của T1575

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1575 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review testing-049 → testing-056 (nội dung mới của T1575, topic testing). Không phát hiện lỗi kỹ thuật (API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ), không có lỗi markup (không backtick/${ bên trong nội dung đáp án), không có chữ nước ngoài lẫn vào (chỉ giữ thuật ngữ kỹ thuật tiếng Anh theo quy ước). Các API dùng đúng Java 17/21 + Spring Boot 3.x (@ServiceConnection Boot 3.1+, @MockitoBean thay @MockBean đã deprecated từ Boot 3.4, Clock.fixed/offset, Awaitility, JUnit 5 @Order/random order, Testcontainers singleton/reuse). node scripts/validate.js → OK.