# T2872R — Fact-check nội dung mới của T2872

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2872 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **lesson-concurrency-029**: Test harness chỉ có 1 test case (cần ≥ 3). Đã mở rộng thành 5 test cases: gọi 50/20/100 lần với maxConcurrent khác nhau, danh sách rỗng, maxConcurrent=1 tuần tự. Sửa test code bắt exception checked trong lambda.
- **lesson-concurrency-030**: Test harness chỉ có 1 test case (chỉ test success path), starter pass do test quá đơn giản. Đã mở rộng thành 4 test cases: success, exception cancellation, empty list, mixed success/failure. Sửa reference implementation unwrap ExecutionException để ném đúng exception gốc. Sửa test code bắt exception checked trong lambda.
- Validation (`node scripts/validate.js`) và test-lessons (`node scripts/test-lessons.js`) đều pass cho track concurrency.
