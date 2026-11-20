# T2471R — Fact-check nội dung mới của T2471

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2471 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 4 câu hỏi mới (core-076 State pattern, core-077 Template Method, core-078 Builder vs Factory, core-079 SRP + Observer/Event bus). Kiểm tra:
- Kiến thức kỹ thuật: ĐÚNG (pattern implementation, pitfalls, production examples hợp lý)
- Markup: ĐÚNG (đúng cú pháp ~~~java, ###, **, |table|, >tip)
- Chữ nước ngoài: Chỉ có thuật ngữ kỹ thuật tiếng Anh được phép (State pattern, Template Method, Builder, Factory, SRP, OCP, Observer, event bus, over-engineering, v.v.)
- Validate: Không báo lỗi cho 4 câu hỏi này (lỗi validate khác là pre-existing ở file khác)
Kết luận: không có lỗi kiến thức.
