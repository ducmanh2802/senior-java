# T2594R — Fact-check nội dung mới của T2594

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2594 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lesson-concurrency-022`: không có lỗi kiến thức kỹ thuật. Semaphore, acquire/release trong fair/unfair, tryAcquire, so sánh với ThreadPoolExecutor, release trong finally, reentrant — tất cả đều đúng. Markup dùng đúng `{{code}}`, không backtick, không `${`. `related` = ['concurrency-003', 'concurrency-012'] đã tồn tại trong q-concurrency-jvm.js. Test exercise (BoundedExecutor) pass 3/3.
- `node scripts/validate.js` → OK — không có lỗi.
- `node scripts/test-lessons.js` → lesson-concurrency-022 OK; 2 lesson khác (design-010, testing-014) fail nhưng không phải của task này (đã có sẵn).
