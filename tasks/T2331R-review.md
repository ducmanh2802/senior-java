# T2331R — Fact-check nội dung mới của T2331

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2331 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Lesson `lesson-jpa-016` (N+1: fetch join và batch fetching) đã đúng kỹ thuật:
- Fetch join: 1 query JOIN, nhân dòng, không phân trang an toàn với collection (HHH90003004)
- Batch fetching: 1 + ceil(N/batchSize) query IN, an toàn cho phân trang, phù hợp danh sách lớn
- @BatchSize / hibernate.default_batch_fetch_size cấu hình đúng
- Bài tập loadOrdersWithItems(strategy) chạy pass test-lessons.js
- Validate OK (index-light.js đã cập nhật)
