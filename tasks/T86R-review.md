# T86R — Fact-check nội dung mới của T86

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T86 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lesson-jpa-001`: thay đoạn kiểm tra flush bị lặp và không liên quan bằng giải thích flush/commit, flush-clear; thay câu quiz N+1 lặp bằng detached entity/dirty checking.
- `lesson-jpa-002`: thay đoạn flush lặp bằng cách kiểm thử query count, giới hạn batch và pagination collection; thay quiz N+1 lặp bằng rủi ro fetch join với pagination.
- `lesson-jpa-003`: thay đoạn flush lặp bằng tính nguyên tử của version check và retry an toàn; thay quiz N+1 lặp bằng giới hạn versioning với bulk JPQL.
- `lesson-jpa-004`: thay đoạn flush lặp bằng ranh giới persistence context, DTO và tải association; thay quiz N+1 lặp bằng cách tránh lazy query khi serialize.
- `lesson-jpa-005`: thay đoạn flush lặp bằng cách xác minh JDBC batching, IDENTITY và pooled SEQUENCE; thay quiz N+1 lặp bằng ý nghĩa thực tế của batch size.
- Đã chạy `node --check js/data/lessons-jpa.js`, `node scripts/test-lessons.js` (36/36 bài tập đạt) và `node scripts/validate.js` (OK).
