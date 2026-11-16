# T2168R — Fact-check nội dung mới của T2168

Status: DONE
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2168 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fixed lesson-api-001 check[0]: Question was changed to "Thay đổi nào sau đây là **breaking change** với client cũ?" but options were HTTP methods (GET, PUT, POST, HEAD) and explanation discussed idempotent/safe. Restored correct question: "Method nào **idempotent nhưng không safe**? (Chọn 1)" matching the options and explanation.
- All other modified check questions (lesson-api-008, lesson-api-009, lesson-api-010) only added "(Chọn 1)" suffix - content was already correct.
- Validation passes: `node scripts/validate.js` → OK
- Lesson tests pass: `node scripts/test-lessons.js` → 298/298 OK
- Light index rebuilt successfully
