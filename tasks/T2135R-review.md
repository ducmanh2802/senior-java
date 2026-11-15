# T2135R — Fact-check nội dung mới của T2135

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2135 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- spring-090: Sửa markup header "Vi du doi thuc" → "Ví dụ đời thực" (thêm dấu tiếng Việt)
- spring-091: Sửa markup header "Vi du doi thuc" → "Ví dụ đời thực" (thêm dấu tiếng Việt)  
- spring-092: Sửa markup header "Vi du doi thuc" → "Ví dụ đời thực" (thêm dấu tiếng Việt)
- spring-093: Sửa markup header "Vi du doi thuc" → "Ví dụ đời thực" (thêm dấu tiếng Việt)
- Nội dung kỹ thuật 4 câu hỏi (spring-090 đến spring-093) đã review: ĐÚNG với Spring Boot 3.x, Kubernetes, HikariCP, Actuator, Micrometer standards. Không có lỗi kiến thức.
