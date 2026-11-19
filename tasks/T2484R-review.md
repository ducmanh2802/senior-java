# T2484R — Fact-check nội dung mới của T2484

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2484 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức trong lessons-jpa.js. Các thay đổi của T2484 là chuyển dấu tiếng Việt (diacritics) + bổ sung câu giải thích Actuator (đúng kỹ thuật). Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
validate.js: không báo lỗi nào thuộc lessons-jpa.js (các lỗi còn lại ở lessons-spring.js/quiz.js/quiz-design.js là của tác vụ khác, không sở hữu, không động theo luật 3 AGENTS.md).
test-lessons.js: lesson-jpa-012 (2/2 bài tập) và lesson-jpa-013 (2/2 bài tập) đều pass (reference pass 100%, starter build được và không pass).
build-light-index.js đã chạy để đồng bộ js/data/index-light.js trước validate.
