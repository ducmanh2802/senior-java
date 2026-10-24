# T128R — Fact-check nội dung mới của T128

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T128 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 8 câu hỏi mới (testing-017 đến testing-024) do T128 thêm vào:

- **testing-017**: Transaction rollback trong test Spring Boot — cơ chế proxy, 4 trường hợp rollback không xảy ra (native JDBC, cross-thread, flush thủ công, REQUIRES_NEW), bẫy @DirtiesContext. Chính xác.
- **testing-018**: Stub/mock/spy/fake, 6 dấu hiệu mock quá nhiều, cách xử lý (thay bằng fake, chỉ mock ranh giới hệ thống ngoài). Chính xác.
- **testing-019**: Chiến lược test Spring Boot (pyramid vs trophy), ánh xạ layer→annotation, context caching, ví dụ 3 tầng. @MockitoBean (Boot 3.4+) đúng. Chính xác.
- **testing-020**: Testcontainers (reuse, @ServiceConnection Boot 3.1+, singleton, warm image), bảng so sánh H2 vs PostgreSQL. Chính xác.
- **testing-021**: Contract testing (Pact consumer-driven vs Spring Cloud Contract provider-driven), quy trình CI, khi nào dùng/không. Chính xác.
- **testing-022**: Test code phụ thuộc thời gian (Clock injection), Awaitility, concurrency test (CyclicBarrier, virtual thread Java 21). Bẫy flaky test. Chính xác.
- **testing-023**: Mutation testing (PIT) vs coverage, ngưỡng coverage hợp lý, cấu hình PIT, dùng trong CI cho module domain. Chính xác.
- **testing-024**: Chiến lược test Kafka consumer (unit/integration/contract), kiểm thử retry/DLP/offset, Testcontainers Kafka, bẫy thường gặp. Chính xác.

Tất cả tuân thủ markup ({{code}}, ###, >, ~~~java, bảng), không có backtick, không có ${ không escape, thuật ngữ tiếng Anh giữ nguyên, câu hỏi phong cách phỏng vấn thật. Validation OK.
